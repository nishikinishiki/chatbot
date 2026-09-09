(() => {
    "use strict";

    function hasValue(value) {
        return value !== undefined && value !== null && value !== "";
    }

    function buildLeadAttributes({
        userResponses = {},
        utmParameters = {},
        formVariant = ""
    } = {}) {
        const attributes = {
            lead_annual_income: userResponses.annual_income,
            lead_age_group: userResponses.age_group,
            lead_occupation: userResponses.occupation,
            lead_utm_source: utmParameters.utm_source,
            lead_utm_medium: utmParameters.utm_medium,
            lead_utm_campaign: utmParameters.utm_campaign,
            lead_form_variant: formVariant
        };

        return Object.fromEntries(
            Object.entries(attributes).filter(([, value]) => hasValue(value))
        );
    }

    function pushLeadAttributes(context = {}) {
        const attributes = buildLeadAttributes(context);

        if (Object.keys(attributes).length === 0) {
            return;
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: "lead_attributes_ready",
            ...attributes
        });
    }

    window.LeadAnalytics = Object.freeze({
        pushLeadAttributes
    });
})();
