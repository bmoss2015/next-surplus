-- Seed a starter set of 4 email templates for every org so the editor and
-- template picker have real content to show on first run. These rely only
-- on the existing email_templates schema (no folders required). Safe to
-- re-run: each insert checks if a template with the same name already
-- exists for the org before inserting.

do $$
declare
  r record;
begin
  for r in select id from orgs loop
    if not exists (
      select 1 from email_templates
      where org_id = r.id and name = 'Opening Outreach — Tax Sale Surplus'
    ) then
      insert into email_templates (org_id, name, subject, body_html, folder_id)
      values (
        r.id,
        'Opening Outreach — Tax Sale Surplus',
        'Following up on your tax sale surplus, {{contact.first_name}}',
        '<p>Hi {{contact.first_name}},</p><p>I''m {{sender.signer_name}} with {{sender.company_name}}. I''m reaching out because your former property at <strong>{{lead.property_address}}</strong> sold at the {{lead.county}} County tax sale and there''s an estimated <strong>{{lead.estimated_surplus}}</strong> in surplus funds the county is holding for the rightful owner.</p><p>These funds aren''t going to be released automatically. Here''s what we do, at no upfront cost to you:</p><ul><li>File and track the claim with {{lead.county}} County on your behalf.</li><li>Cover all legal and filing fees ourselves until you''re paid.</li><li>Our fee is {{lead.recovery_fee_pct}} of the recovered amount — your estimated net is around <strong>{{lead.est_net_to_owner}}</strong>.</li></ul><p>Most claims resolve within 90 to 180 days. Reply to this email or call me directly if you''d like to talk through the details.</p>',
        null
      );
    end if;

    if not exists (
      select 1 from email_templates
      where org_id = r.id and name = 'Follow-Up — Still There?'
    ) then
      insert into email_templates (org_id, name, subject, body_html, folder_id)
      values (
        r.id,
        'Follow-Up — Still There?',
        'Quick follow-up on your {{lead.property_city}} surplus',
        '<p>Hi {{contact.first_name}},</p><p>Wanted to bump my note from last week. The surplus funds from <strong>{{lead.property_address}}</strong> are still sitting unclaimed with {{lead.county}} County, and there''s no rush from their side to get them to you.</p><p>If now isn''t the right time I understand — just reply <strong>not interested</strong> and I''ll stop reaching out. Otherwise, a short 10-minute call is all it takes to get the claim started.</p><p>Talk soon,<br>{{sender.signer_name}}</p>',
        null
      );
    end if;

    if not exists (
      select 1 from email_templates
      where org_id = r.id and name = 'Paperwork Ready — Sign To Move Forward'
    ) then
      insert into email_templates (org_id, name, subject, body_html, folder_id)
      values (
        r.id,
        'Paperwork Ready — Sign To Move Forward',
        'Paperwork ready for {{lead.property_street_address}}',
        '<p>Hi {{contact.first_name}},</p><p>Good news — the paperwork to file your claim on the <strong>{{lead.property_address}}</strong> surplus is ready for your signature.</p><p>Quick summary:</p><ul><li>Estimated surplus on file: <strong>{{lead.estimated_surplus}}</strong></li><li>Our recovery fee: {{lead.recovery_fee_pct}}</li><li>Your estimated net after fees: <strong>{{lead.est_net_to_owner}}</strong></li></ul><p>I''ll send the signature link in a separate email. Once signed, we file with {{lead.county}} County within 48 hours. Reach out anytime with questions.</p><p>{{sender.signer_name}}<br>{{sender.signer_title}}, {{sender.company_name}}</p>',
        null
      );
    end if;

    if not exists (
      select 1 from email_templates
      where org_id = r.id and name = 'Funds Recovered — Next Steps'
    ) then
      insert into email_templates (org_id, name, subject, body_html, folder_id)
      values (
        r.id,
        'Funds Recovered — Next Steps',
        'Your surplus claim has been approved',
        '<p>Hi {{contact.first_name}},</p><p>Great news — {{lead.county}} County has approved the surplus claim on <strong>{{lead.property_address}}</strong>.</p><p>The recovered amount is being released to our trust account, and we''ll wire your portion within 3 business days of receipt.</p><p>You don''t need to do anything else on your end. I''ll send a closing statement and a confirmation as soon as the wire goes out.</p><p>Thanks for trusting {{sender.company_name}} with this claim — it''s been a pleasure working with you.</p><p>{{sender.signer_name}}</p>',
        null
      );
    end if;
  end loop;
end $$;
