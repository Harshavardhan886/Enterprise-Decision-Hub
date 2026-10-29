package com.edh.repository;

import com.edh.model.Vendor;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface VendorRepository extends MongoRepository<Vendor, String> {
    Optional<Vendor> findByVendorName(String vendorName);
    List<Vendor> findByRiskLevel(String riskLevel);
}
