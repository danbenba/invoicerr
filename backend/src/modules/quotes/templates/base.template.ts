export const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{labels.quote}} {{number}}</title>
    <style>
        body { font-family: {{fontFamily}}, sans-serif; margin: {{padding}}px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info h1 { margin: 0; color: #1e3a8a; font-size: 24px; } /* blue-900 */
        .quote-info { text-align: right; }
        .client-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        th { background-color: #6366f1; color: white; padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; }
        td { padding: 8px 16px; text-align: left; border-bottom: 1px dashed #e5e7eb; color: #111827; font-size: 14px; }
        th:last-child, td:last-child { text-align: right; }
        .total-row { font-weight: bold; background-color: white; color: #111827; }
        .notes { margin-top: 20px; padding: 20px; background-color: #f8fafc; border-radius: 4px; color: #334155; }
        .payment-info { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #6366f1; color: #333; }
        .logo { max-height: 80px; margin-bottom: 10px; }
        .validity { color: #dc2626; font-weight: bold; }
        .footer-text { text-align: center; margin-top: 20px; color: #666; font-size: 12px; border-top: 1px dashed #ccc; padding-top: 10px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; padding: 0 20px; }
        .acceptance { font-style: italic; color: #666; font-size: 14px; }
        .signature-box { border: 1px solid #ddd; height: 100px; width: 250px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; color: #aaa; font-size: 12px; border-radius: 4px; }
        .section-item { font-weight: bold; font-style: italic; color: #ef4444; } /* red-500 */
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            {{#if includeLogo}}
                <img src="{{logoB64}}" alt="Logo" class="logo">
            {{/if}}
            <h1>{{company.name}}</h1><br>
            {{#if company.description}}<strong>{{labels.description}}</strong> {{company.description}}<br>{{/if}}
            <p>{{company.address}}<br>
            {{company.city}}, {{company.postalCode}}<br>
            {{company.country}}<br>
            {{company.email}} | {{company.phone}}<br>
            {{#if company.legalId}}<strong>{{labels.legalId}}:</strong> {{company.legalId}}<br>{{/if}}
            {{#if company.VAT}}<strong>{{labels.VATId}}:</strong> {{company.VAT}}{{/if}}</p>
        </div>
        <div class="quote-info">
            <h2>{{labels.quote}}</h2>
            <p><strong>{{labels.quote}}:</strong> #{{number}}<br>
            <strong>{{labels.date}}</strong> {{date}}<br>
            <strong class="validity">{{labels.validUntil}}</strong> {{validUntil}}</p>
        </div>
    </div>
    <div class="client-info">
        <h3>{{labels.quoteFor}}</h3>
        <p>{{client.name}}<br>
        {{#if client.description}}<strong>{{labels.description}}</strong> {{client.description}}<br>{{/if}}
        {{client.address}}<br>
        {{client.city}}, {{client.postalCode}}<br>
        {{client.country}}<br>
        {{client.email}}</br>
        {{#if client.legalId}}<strong>{{labels.legalId}}:</strong> {{client.legalId}}<br>{{/if}}
        {{#if client.VAT}}<strong>{{labels.VATId}}:</strong> {{client.VAT}}{{/if}}</p>
    </div>
    <table>
        <thead>
            <tr>
                {{#if showType}}<th>{{labels.type}}</th>{{/if}}
                <th>{{labels.description}}</th>
                {{#if showQty}}<th>{{labels.quantity}}</th>{{/if}}
                {{#if showVAT}}<th>{{labels.vatRate}}</th>{{/if}}
                <th>{{labels.unitPrice}}</th>
                <th>{{labels.total}}</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                {{#if ../showType}}<td>{{type}}</td>{{/if}}
                <td>{{description}}</td>
                {{#if ../showQty}}<td>{{quantity}}</td>{{/if}}
                {{#if ../showVAT}}<td>{{vatRate}}%</td>{{/if}}
                <td>{{../currency}} {{unitPrice}}</td>
                <td>{{../currency}} {{totalPrice}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="{{colSpan}}"><strong>{{labels.subtotal}}</strong></td>
                <td><strong>{{currency}} {{totalHT}}</strong></td>
            </tr>
            <tr>
                <td colspan="{{colSpan}}"><strong>{{labels.vat}}</strong></td>
                <td><strong>{{currency}} {{totalVAT}}</strong></td>
            </tr>
            {{#if vatExemptText}}
            <tr>
                <td></td>
                <td colspan="{{colSpan}}" style="font-size:12px; color:#666; text-align:right;"><em>{{vatExemptText}}</em></td>
            </tr>
            {{/if}}
            <tr class="total-row">
                <td colspan="{{colSpan}}"><strong>{{labels.grandTotal}}</strong></td>
                <td><strong>{{currency}} {{totalTTC}}</strong></td>
            </tr>
        </tfoot>
    </table>
    
    {{#if paymentMethod}}
    <div class="payment-info">
        <strong>{{labels.paymentMethod}}</strong> {{paymentMethod}}<br>
        {{#if paymentDetails}}
        <strong>{{labels.paymentDetails}}</strong> {{{paymentDetails}}}
        {{/if}}
    </div>
    {{/if}}
    
    {{#if noteExists}}
    <div class="notes">
        <h4>{{labels.notes}}</h4>
        <p>{{{notes}}}</p>
    </div>
    {{/if}}

    {{#if showSignatureSection}}
    <div class="signature-section">
        {{#if showAcceptance}}
        <div class="acceptance">
            "Bon pour accord"
        </div>
        {{/if}}
        {{#if showSignature}}
        <div class="signature-box">
            Zone de signature
        </div>
        {{/if}}
    </div>
    {{/if}}

    {{#if footerText}}
    <div class="footer-text">{{footerText}}</div>
    {{/if}}
</body>
</html>
`;
