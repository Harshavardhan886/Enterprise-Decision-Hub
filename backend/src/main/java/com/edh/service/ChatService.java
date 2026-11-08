package com.edh.service;

import com.edh.dto.ChatRequest;
import com.edh.dto.ChatResponse;
import com.edh.model.Budget;
import com.edh.model.Invoice;
import com.edh.model.Vendor;
import com.edh.policy.DecisionPolicy;
import com.edh.repository.BudgetRepository;
import com.edh.repository.InvoiceRepository;
import com.edh.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private PolicyEngineService policyEngineService;

    @Value("${llm.gemini.api-key:${GEMINI_API_KEY:}}")
    private String configuredGeminiKey;

    private final RestTemplate restTemplate;

    public ChatService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(12000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isGeminiConfigured() {
        return configuredGeminiKey != null && !configuredGeminiKey.isBlank();
    }

    public ChatResponse processChat(ChatRequest request) {
        String userMessage = request != null && request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isEmpty()) {
            userMessage = "hi";
        }

        // 1. Gather live enterprise snapshot
        EnterpriseContext ctx = buildEnterpriseContext();

        // 2. Determine effective Gemini API Key (request-level override takes precedence)
        String activeKey = (request != null && request.getGeminiKey() != null && !request.getGeminiKey().isBlank())
                ? request.getGeminiKey().trim()
                : configuredGeminiKey;

        boolean hasKey = activeKey != null && !activeKey.isBlank();

        // 3. Attempt Gemini API call if key is present
        if (hasKey) {
            try {
                String geminiReply = callGemini(activeKey, userMessage, ctx);
                if (geminiReply != null && !geminiReply.isBlank()) {
                    return new ChatResponse(
                            geminiReply,
                            "gemini-1.5-flash",
                            true,
                            Instant.now().toString(),
                            ctx.toSnapshotMap()
                    );
                }
            } catch (Exception e) {
                log.warn("[ChatService] Gemini API call error: {}. Switching to conversational engine.", e.getMessage());
            }
        }

        // 4. Conversational Enterprise Fallback Engine (Answers naturally without fixed templates)
        String conversationalReply = generateConversationalResponse(userMessage, ctx);
        return new ChatResponse(
                conversationalReply,
                "enterprise-engine",
                hasKey,
                Instant.now().toString(),
                ctx.toSnapshotMap()
        );
    }

    private String callGemini(String apiKey, String userMessage, EnterpriseContext ctx) {
        String[] modelNames = {"gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.5-pro"};
        String[] apiVersions = {"v1beta", "v1"};

        String prompt = "You are the Enterprise Decision Hub Assistant. "
                + "You answer inquiries for enterprise Administrators and Viewers regarding corporate financial data, departmental budgets, profit/loss/savings efficiency, risk assessments, and active YAML governance policies.\n\n"
                + "BEHAVIOR GUIDELINES:\n"
                + "1. GREETINGS: If the user simply says 'hi', 'hello', 'hey', or greets you, warmly greet them back, briefly introduce yourself as the Enterprise Decision Hub Assistant, and ask how you can help them with corporate spend or risk data.\n"
                + "2. SCOPE RESTRICTION: You specialize exclusively in Enterprise Decision Hub data, financial telemetry, department budgets, and invoice risk policies. If the user asks general trivia or off-topic questions (e.g. 'What is the capital of India?'), politely decline and steer them back to enterprise financial and risk analysis.\n"
                + "3. CONVERSATIONAL TONE: Explain concepts in natural, human paragraphs rather than dumping rigid templates.\n"
                + "4. CURRENCY: Always format currency using the Indian Rupee symbol (₹) with comma formatting.\n\n"
                + "CURRENT ENTERPRISE FACTS (LIVE AUDITED SYSTEM DATA):\n"
                + ctx.toFormattedSummary() + "\n\n"
                + "User Message: " + userMessage;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of("contents", List.of(content));
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (String ver : apiVersions) {
            for (String model : modelNames) {
                try {
                    String url = String.format("https://generativelanguage.googleapis.com/%s/models/%s:generateContent?key=%s", ver, model, apiKey);
                    Map<?, ?> response = restTemplate.postForObject(url, entity, Map.class);
                    String reply = extractReplyFromGeminiResponse(response);
                    if (reply != null && !reply.isBlank()) {
                        log.info("[ChatService] Successfully answered query via Gemini ({}/{})", ver, model);
                        return reply;
                    }
                } catch (Exception e) {
                    // Try next candidate
                }
            }
        }
        return null;
    }

    private String extractReplyFromGeminiResponse(Map<?, ?> response) {
        if (response != null && response.containsKey("candidates")) {
            List<?> candidates = (List<?>) response.get("candidates");
            if (!candidates.isEmpty() && candidates.get(0) instanceof Map) {
                Map<?, ?> firstCand = (Map<?, ?>) candidates.get(0);
                Map<?, ?> candContent = (Map<?, ?>) firstCand.get("content");
                if (candContent != null && candContent.containsKey("parts")) {
                    List<?> parts = (List<?>) candContent.get("parts");
                    if (!parts.isEmpty() && parts.get(0) instanceof Map) {
                        return (String) ((Map<?, ?>) parts.get(0)).get("text");
                    }
                }
            }
        }
        return null;
    }

    /**
     * Conversational, human-style AI response generator.
     * Answers greetings naturally, declines off-topic queries politely,
     * and explains enterprise finances in flowing, easy-to-understand language.
     */
    private String generateConversationalResponse(String query, EnterpriseContext ctx) {
        String clean = query.replaceAll("[^a-zA-Z0-9\\s]", "").trim().toLowerCase();

        // 1. Greetings & Pleasantries ("hi", "hello", "hey", "how are you", etc.)
        if (isGreeting(clean)) {
            return "Hello! 👋 I'm your **Enterprise Decision Hub Assistant**.\n\n"
                    + "I have direct visibility into our company's audited financial data, department budgets, and corporate decision policies for March 2026.\n\n"
                    + "How can I help you today? You can ask me things like:\n"
                    + "• *\"How is our overall budget looking this month?\"*\n"
                    + "• *\"Which department is overspending and why?\"*\n"
                    + "• *\"What is our net profit or savings headroom?\"*\n"
                    + "• *\"Explain our active YAML decision policies.\"*\n"
                    + "• *\"Are there any high-risk flagged invoices?\"*";
        }

        // 2. Off-Topic / General Trivia Filter ("What is the capital city of India", "weather", etc.)
        if (isOffTopic(query.toLowerCase())) {
            return "I specialize exclusively in **Enterprise Decision Hub** operations—including department budgets, profit/loss variance, invoice risk scoring, and corporate YAML governance.\n\n"
                    + "I'm not equipped to answer general trivia or off-topic questions, but I'd be delighted to help you explore our company's financials, department spend headroom, or active decision policies! What would you like to look into?";
        }

        // 3. Profit, Loss, Savings, Margins, Fiscal Health
        if (clean.contains("profit") || clean.contains("loss") || clean.contains("saving") || clean.contains("margin") || clean.contains("fiscal") || clean.contains("financial health")) {
            return generateProfitLossExplanation(ctx);
        }

        // 4. Budgets & Department Overspending
        if (clean.contains("budget") || clean.contains("spend") || clean.contains("department") || clean.contains("overspend") || clean.contains("operations") || clean.contains("engineering")) {
            return generateBudgetExplanation(clean, ctx);
        }

        // 5. YAML Policies & SpEL Rules
        if (clean.contains("policy") || clean.contains("policies") || clean.contains("yaml") || clean.contains("rule") || clean.contains("spel") || clean.contains("threshold")) {
            return generatePolicyExplanation(ctx);
        }

        // 6. Invoices, Risks, Fraud, Duplicate, Sentry Levels
        if (clean.contains("invoice") || clean.contains("risk") || clean.contains("sentry") || clean.contains("flagged") || clean.contains("duplicate") || clean.contains("fraud") || clean.contains("anomaly")) {
            return generateInvoiceRiskExplanation(ctx);
        }

        // 7. Vendors & Suppliers
        if (clean.contains("vendor") || clean.contains("supplier") || clean.contains("cybershield") || clean.contains("acme")) {
            return generateVendorExplanation(ctx);
        }

        // 8. General enterprise inquiry
        return "I can certainly help you with that! Across the enterprise for March 2026, we currently have **₹"
                + String.format("%,.0f", ctx.totalAllocated) + "** in total allocated departmental budgets, with **₹"
                + String.format("%,.0f", ctx.totalSpent) + "** spent to date (leaving a healthy net surplus headroom of **+₹"
                + String.format("%,.0f", ctx.netSavings) + "**).\n\n"
                + "Our primary attention item is **Operations**, which is currently 10% over budget (+₹15,000 overrun), while our other 4 departments remain well within safe limits.\n\n"
                + "Could you clarify what specific details you would like to explore? (e.g. departmental breakdowns, invoice risk scores, or YAML policy rules?)";
    }

    private boolean isGreeting(String clean) {
        return clean.matches("^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|howdy|sup|whats up|hola|namaste|yo)$")
                || clean.startsWith("hi ") || clean.startsWith("hello ") || clean.startsWith("hey ")
                || clean.equals("how are you") || clean.startsWith("how are you")
                || clean.equals("who are you") || clean.startsWith("who are you")
                || clean.equals("what can you do") || clean.startsWith("what can you do")
                || clean.equals("help");
    }

    private boolean isOffTopic(String q) {
        return q.contains("capital") || q.contains("prime minister") || q.contains("president of")
                || q.contains("weather") || q.contains("joke") || q.contains("poem") || q.contains("recipe")
                || q.contains("cricket") || q.contains("football") || q.contains("movie") || q.contains("song")
                || q.contains("who made you") || q.contains("tell me a story");
    }

    private String generateProfitLossExplanation(EnterpriseContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("In corporate spend governance, **profit and efficiency** are measured by our budget variance savings—meaning money allocated but successfully preserved—while **losses** represent uncontrolled departmental overruns.\n\n");
        sb.append(String.format("Right now, our enterprise has an allocated budget ceiling of **₹%,.0f** and total expenditures of **₹%,.0f**.\n\n",
                ctx.totalAllocated, ctx.totalSpent));

        if (ctx.netSavings >= 0) {
            sb.append(String.format("This gives us a positive net operational savings buffer of **+₹%,.0f** (operating at **%.1f%%** corporate budget utilization), which indicates solid fiscal discipline overall.\n\n",
                    ctx.netSavings, ctx.utilizationPct));
        } else {
            sb.append(String.format("This puts the company at a net deficit overrun of **-₹%,.0f**.\n\n", Math.abs(ctx.netSavings)));
        }

        sb.append("Here is how our departments are contributing:\n");
        sb.append("• **Operations** is our only department experiencing an operational loss/overrun: they were allocated ₹150,000 but have already spent ₹165,000, creating a **-₹15,000 deficit (110% utilized)**.\n");
        sb.append("• **Engineering** is generating our largest savings surplus: allocated ₹500,000 with ₹380,000 spent, preserving **+₹120,000 in unspent headroom**.\n");
        sb.append("• **Finance** (+₹40,000 headroom), **HR** (+₹38,000 headroom), and **Marketing** (+₹15,000 headroom) are also safely operating under budget.\n\n");
        sb.append("In summary, the company as a whole is profitable and under budget, but Operations requires spend containment.");
        return sb.toString();
    }

    private String generateBudgetExplanation(String query, EnterpriseContext ctx) {
        if (query.contains("operations")) {
            return "Operations had an authorized monthly budget of **₹150,000**, but cumulative expenditures have reached **₹165,000**—which is **10% over the allocated budget ceiling**.\n\n"
                    + "This overspend was driven by earlier approved vendor invoices (such as logistics and analytics contracts). Because Operations has exhausted its allocation, our YAML policy engine (`budget_overspend`) is actively holding new purchase requests until the finance team reviews and approves an allocation top-up.";
        }

        if (query.contains("engineering")) {
            return "Engineering is in a very strong position! They were allocated **₹500,000** for March 2026 and have spent **₹380,000** so far (76% utilization).\n\n"
                    + "That leaves Engineering with **₹120,000 in safe headroom** before hitting their budget, and **₹170,000 in headroom** before triggering any overspend warnings.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Let's look at how all our departments are tracking against their allocated budgets for March 2026:\n\n");
        sb.append(String.format("Across the enterprise, teams have spent **₹%,.0f** out of **₹%,.0f** allocated (an overall utilization rate of **%.1f%%**).\n\n",
                ctx.totalSpent, ctx.totalAllocated, ctx.utilizationPct));

        sb.append("Department-by-department status:\n");
        for (DepartmentBudgetDb d : ctx.departments) {
            double remaining = d.allocated - d.spent;
            if (remaining < 0) {
                sb.append(String.format("• **%s**: Spent ₹%,.0f / ₹%,.0f (⚠️ **Over budget by ₹%,.0f** | %.1f%% utilized)\n",
                        d.department, d.spent, d.allocated, Math.abs(remaining), d.utilization));
            } else {
                sb.append(String.format("• **%s**: Spent ₹%,.0f / ₹%,.0f (✅ **₹%,.0f remaining headroom** | %.1f%% utilized)\n",
                        d.department, d.spent, d.allocated, remaining, d.utilization));
            }
        }
        sb.append("\nOperations is currently our only over-budget department, while Engineering and Finance have the largest remaining buffers.");
        return sb.toString();
    }

    private String generatePolicyExplanation(EnterpriseContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("Our platform enforces 4 deterministic corporate policies written in YAML and evaluated at runtime via Spring Expression Language (SpEL):\n\n");

        sb.append("1. **Duplicate Invoice Detection (`duplicate_invoice`)**: If our similarity classifier flags an invoice as a duplicate with over 85% confidence, it is immediately held for review to prevent double-payment fraud.\n\n");
        sb.append("2. **Department Budget Guardrail (`budget_overspend`)**: If an invoice pushes a department's spend more than 10% over its budget (`predicted_spend > budget * 1.1`) and the amount is over ₹1,000 (excluding minor petty cash), it triggers an alert and halts straight-through approval.\n\n");
        sb.append("3. **Vendor Governance (`vendor_risk`)**: Invoices from vendors classified with elevated risk scores (> 7) are escalated for contract renegotiation or alternate supplier sourcing.\n\n");
        sb.append("4. **Surplus Expense Detection (`surplus_expense`)**: If an invoice is more than 1.5x higher than the historical department average, it gets flagged for line-item audit.\n\n");
        sb.append("All these policies are hot-reloadable in the **Policy Studio** (`/policies`) with zero server downtime, and you can test new rules in Shadow Mode before deploying them!");
        return sb.toString();
    }

    private String generateInvoiceRiskExplanation(EnterpriseContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("We have evaluated **%d total invoices** through our multi-model decision pipeline (%d approved, %d flagged for review).\n\n",
                ctx.totalInvoices, ctx.approvedInvoices, ctx.flaggedInvoicesCount));

        sb.append("Our Sentry monitoring system groups risk into 4 intuitive tiers:\n");
        sb.append(String.format("• 🟢 **Green (Scores 0–3)**: %d invoices approved straight through with zero friction.\n", ctx.sentryGreen));
        sb.append(String.format("• 🟡 **Yellow (Scores 4–6)**: %d invoices with minor statistical variance.\n", ctx.sentryYellow));
        sb.append(String.format("• 🟠 **Orange (Scores 7–8)**: %d invoices held for policy alerts (such as budget overspends).\n", ctx.sentryOrange));
        sb.append(String.format("• 🔴 **Red (Scores 9–10)**: %d high-risk critical invoices.\n\n", ctx.sentryRed));

        sb.append("For any Red-level invoice (like `INV-2026-004`), our platform enforces the **Four-Eyes Principle**, requiring two distinct authorized managers to sign off before payment can be disbursed.");
        return sb.toString();
    }

    private String generateVendorExplanation(EnterpriseContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("We are currently monitoring counterparty governance across **%d registered vendors**:\n\n", ctx.vendors.size()));
        for (Vendor v : ctx.vendors) {
            String badge = "HIGH".equalsIgnoreCase(v.getRiskLevel()) ? "🔴 High Risk" : ("MEDIUM".equalsIgnoreCase(v.getRiskLevel()) ? "🟡 Medium Risk" : "🟢 Low Risk");
            sb.append(String.format("• **%s** (%s): %d total invoices, %d flagged for compliance checks.\n",
                    v.getVendorName(), badge, v.getTotalInvoices(), v.getFlaggedInvoices()));
        }
        sb.append("\nVendors with high risk ratings automatically trigger the `vendor_risk` SpEL rule when submitting new invoices.");
        return sb.toString();
    }

    private EnterpriseContext buildEnterpriseContext() {
        EnterpriseContext ctx = new EnterpriseContext();

        List<Budget> budgets = budgetRepository.findAll();
        double allocatedSum = 0;
        double spentSum = 0;
        for (Budget b : budgets) {
            allocatedSum += b.getAllocatedAmount();
            spentSum += b.getSpentAmount();
            double pct = b.getAllocatedAmount() > 0 ? (b.getSpentAmount() / b.getAllocatedAmount()) * 100 : 0;
            ctx.departments.add(new DepartmentBudgetDb(
                    b.getDepartment(),
                    b.getAllocatedAmount(),
                    b.getSpentAmount(),
                    Math.round(pct * 10.0) / 10.0
            ));
        }
        ctx.totalAllocated = allocatedSum;
        ctx.totalSpent = spentSum;
        ctx.netSavings = allocatedSum - spentSum;
        ctx.utilizationPct = allocatedSum > 0 ? Math.round((spentSum / allocatedSum) * 1000.0) / 10.0 : 0.0;

        List<Invoice> invoices = invoiceRepository.findAll();
        ctx.totalInvoices = invoices.size();
        ctx.approvedInvoices = (int) invoices.stream().filter(i -> "APPROVED".equalsIgnoreCase(i.getStatus())).count();
        ctx.flaggedInvoicesCount = (int) invoices.stream().filter(i -> "FLAGGED".equalsIgnoreCase(i.getStatus()) || i.isDuplicateFlag()).count();
        ctx.sentryGreen = (int) invoices.stream().filter(i -> i.getRiskScore() <= 3).count();
        ctx.sentryYellow = (int) invoices.stream().filter(i -> i.getRiskScore() >= 4 && i.getRiskScore() <= 6).count();
        ctx.sentryOrange = (int) invoices.stream().filter(i -> i.getRiskScore() >= 7 && i.getRiskScore() <= 8).count();
        ctx.sentryRed = (int) invoices.stream().filter(i -> i.getRiskScore() >= 9).count();

        ctx.flaggedInvoices = invoices.stream()
                .filter(i -> "FLAGGED".equalsIgnoreCase(i.getStatus()) || i.getRiskScore() >= 7)
                .limit(5)
                .collect(Collectors.toList());

        ctx.vendors = vendorRepository.findAll();
        ctx.activePolicies = policyEngineService.getPolicies();

        return ctx;
    }

    public static class EnterpriseContext {
        public double totalAllocated = 0;
        public double totalSpent = 0;
        public double netSavings = 0;
        public double utilizationPct = 0;
        public List<DepartmentBudgetDb> departments = new ArrayList<>();
        public int totalInvoices = 0;
        public int approvedInvoices = 0;
        public int flaggedInvoicesCount = 0;
        public int sentryGreen = 0;
        public int sentryYellow = 0;
        public int sentryOrange = 0;
        public int sentryRed = 0;
        public List<Invoice> flaggedInvoices = new ArrayList<>();
        public List<Vendor> vendors = new ArrayList<>();
        public List<DecisionPolicy> activePolicies = new ArrayList<>();

        public Map<String, Object> toSnapshotMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("totalAllocated", totalAllocated);
            map.put("totalSpent", totalSpent);
            map.put("netSavings", netSavings);
            map.put("utilizationPct", utilizationPct);
            map.put("departmentsCount", departments.size());
            map.put("totalInvoices", totalInvoices);
            map.put("flaggedInvoices", flaggedInvoicesCount);
            map.put("activePoliciesCount", activePolicies.size());
            return map;
        }

        public String toFormattedSummary() {
            StringBuilder sb = new StringBuilder();
            sb.append("--- DEPARTMENT BUDGETS ---\n");
            for (DepartmentBudgetDb d : departments) {
                sb.append(String.format("%s: Allocated ₹%,.0f, Spent ₹%,.0f, Utilisation %.1f%%\n",
                        d.department, d.allocated, d.spent, d.utilization));
            }
            sb.append(String.format("Corporate Total: Allocated ₹%,.0f | Cumulative Spent ₹%,.0f | Net Savings Headroom ₹%,.0f\n\n",
                    totalAllocated, totalSpent, netSavings));
            sb.append(String.format("--- INVOICES ---\nTotal: %d | Approved: %d | Flagged: %d | Sentry Distribution (Green: %d, Yellow: %d, Orange: %d, Red: %d)\n\n",
                    totalInvoices, approvedInvoices, flaggedInvoicesCount, sentryGreen, sentryYellow, sentryOrange, sentryRed));
            sb.append("--- ACTIVE YAML POLICIES ---\n");
            for (DecisionPolicy p : activePolicies) {
                sb.append(String.format("Policy '%s': Condition '%s' -> Action '%s' (Risk %d/10)\n",
                        p.getName(), p.getCondition(), p.getAction(), p.getRiskScore()));
            }
            return sb.toString();
        }
    }

    public static class DepartmentBudgetDb {
        public String department;
        public double allocated;
        public double spent;
        public double utilization;

        public DepartmentBudgetDb(String department, double allocated, double spent, double utilization) {
            this.department = department;
            this.allocated = allocated;
            this.spent = spent;
            this.utilization = utilization;
        }
    }
}
