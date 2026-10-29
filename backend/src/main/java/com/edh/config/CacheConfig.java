package com.edh.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 4-Layer Architecture: Data Layer (Database + Cache)
 * Configures high-performance caching for policy rules, dashboard stats,
 * ML model metadata, and frequently queried reference datasets.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(List.of(
                "policies",
                "dashboard-stats",
                "model-info",
                "vendors"
        ));
        return cacheManager;
    }
}
