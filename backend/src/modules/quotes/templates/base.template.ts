export const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{labels.quote}} {{number}}</title>
    <style>
        @page {
            margin: 0;
            size: A4;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { 
            font-family: {{fontFamily}}, sans-serif; 
            margin: 0;
            padding: {{padding}}px; 
            color: #000;
            background: white;
            font-size: 12px;
            line-height: 1.6;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            align-items: flex-start;
        }
        .client-info {
            flex: 1;
        }
        .client-info h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
        }
        .client-info p {
            font-size: 12px;
            line-height: 1.6;
            color: #000;
        }
        .company-info {
            text-align: right;
            flex: 1;
        }
        .company-info p {
            font-size: 11px;
            line-height: 1.6;
            color: #000;
        }
        .quote-title {
            margin: 25px 0;
        }
        .quote-title h2 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
        }
        .quote-title p {
            font-size: 12px;
            line-height: 1.6;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 12px;
        }
        th, td { 
            padding: 10px 8px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        th { 
            background-color: transparent; 
            font-weight: bold; 
            color: #000;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
        }
        tbody tr {
            border-bottom: 1px solid #ddd;
        }
        tfoot tr {
            border-top: 1px solid #ddd;
        }
        tfoot tr:last-child {
            border-top: 2px solid #000;
            font-weight: bold;
        }
        .total-row { 
            font-weight: bold; 
            background-color: transparent;
        }
        .section-row {
            background-color: transparent;
            font-weight: bold;
        }
        .section-row td {
            padding-top: 15px;
            padding-bottom: 8px;
        }
        .description-cell {
            line-height: 1.6;
        }
        .description-cell p {
            margin: 4px 0;
        }
        .description-cell strong {
            font-weight: bold;
        }
        .description-cell em {
            font-style: italic;
        }
        .description-cell h1, .description-cell h2, .description-cell h3 {
            font-weight: bold;
            margin: 8px 0 4px 0;
        }
        .description-cell h1 {
            font-size: 18px;
        }
        .description-cell h2 {
            font-size: 16px;
        }
        .description-cell h3 {
            font-size: 14px;
        }
        .description-cell ul, .description-cell ol {
            margin: 4px 0;
            padding-left: 20px;
        }
        .description-cell code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 11px;
        }
        .description-cell blockquote {
            border-left: 3px solid #ddd;
            padding-left: 10px;
            margin: 4px 0;
            font-style: italic;
        }
        .description-cell a {
            color: #2563eb;
            text-decoration: underline;
        }
        .payment-info { 
            margin-top: 25px; 
            padding: 0;
            font-size: 11px;
            color: #000;
            line-height: 1.6;
        }
        .payment-info p {
            margin: 3px 0;
        }
        .penalty-text {
            margin-top: 10px;
            font-size: 11px;
            color: #000;
            line-height: 1.6;
        }
        .vat-exempt {
            font-size: 11px;
            color: #000;
            text-align: right;
            margin-top: 10px;
            font-style: italic;
        }
        .footer-text {
            text-align: center;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="client-info">
            <h1>{{client.name}}</h1>
            <p>
                {{client.address}}<br>
                {{client.postalCode}} {{client.city}}<br>
                {{client.country}}
            </p>
        </div>
        <div class="company-info">
            {{#if company.description}}
            <p>
                {{company.description}}<br>
            </p>
            {{/if}}
            <p>
                {{company.address}}<br>
                {{company.postalCode}} {{company.city}}<br>
                {{company.country}}<br>
                {{#if company.phone}}Mobile : {{company.phone}}<br>{{/if}}
                {{#if company.email}}Email : {{company.email}}<br>{{/if}}
                {{#if company.legalId}}SIREN : {{company.legalId}}<br>{{/if}}
                {{#if company.VAT}}SIRET : {{company.VAT}}{{/if}}
            </p>
        </div>
    </div>
    <div class="quote-title">
        <h2>{{labels.quote}} N° {{number}}</h2>
        <p>
            Date d'émission : {{date}}<br>
            {{#if paymentMethod}}
            Règlement : {{paymentMethod}}
            {{else}}
            Règlement : À réception
            {{/if}}
        </p>
    </div>
    <table>
        <thead>
            <tr>
                <th>{{labels.description}}</th>
                {{#if showVAT}}
                <th style="text-align: center;">{{labels.vatRate}}</th>
                {{/if}}
                <th style="text-align: right;">Montant HT</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            {{#if isSection}}
            <tr class="section-row">
                <td colspan="{{../colSpan}}">{{{description}}}</td>
            </tr>
            {{else}}
            <tr>
                <td class="description-cell">{{{description}}}</td>
                {{#if ../showVAT}}
                <td style="text-align: center;">{{vatRate}}%</td>
                {{/if}}
                <td style="text-align: right;">{{unitPrice}} {{../currency}}</td>
            </tr>
            {{/if}}
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td><strong>Total HT</strong></td>
                {{#if showVAT}}
                <td></td>
                {{/if}}
                <td style="text-align: right;"><strong>{{totalHT}} {{currency}}</strong></td>
            </tr>
            {{#if showVAT}}
            <tr>
                <td><strong>Total TTC</strong></td>
                <td></td>
                <td style="text-align: right;"><strong>{{totalTTC}} {{currency}}</strong></td>
            </tr>
            {{else}}
            <tr class="total-row">
                <td><strong>Total TTC</strong></td>
                <td style="text-align: right;"><strong>{{totalTTC}} {{currency}}</strong></td>
            </tr>
            {{/if}}
        </tfoot>
    </table>

    {{#if paymentDetails}}
    <div class="payment-info">
        {{{paymentDetails}}}
    </div>
    {{/if}}

    <div class="penalty-text">
        En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, à laquelle s'ajoutera une indemnité forfaitaire pour frais de recouvrement de 40€.
    </div>

    {{#if vatExemptText}}
    <div class="vat-exempt">{{vatExemptText}}</div>
    {{/if}}

    {{#if footerText}}
    <div class="footer-text">{{footerText}} - Page 1/1</div>
    {{/if}}
</body>
</html>
`;
