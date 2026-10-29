package com.edh.controller;

import com.edh.model.Vendor;
import com.edh.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @GetMapping
    public List<Vendor> getAllVendors() {
        return vendorService.getAllVendors();
    }

    @GetMapping("/risk/{riskLevel}")
    public List<Vendor> getByRiskLevel(@PathVariable String riskLevel) {
        return vendorService.getVendorsByRiskLevel(riskLevel);
    }
}
