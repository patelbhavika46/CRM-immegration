<?php

/**
 * Facade re-export so existing IoC bindings still resolve.
 * The real implementation is in App\Services\LeadConversion\LeadConversionService.
 */

namespace App\Services;

class LeadConversionService extends \App\Services\LeadConversion\LeadConversionService {}
