# Tasks

## P0 - Accessibility and contacts

- [ ] 1. Repair layouts at the specified widths and 200% zoom.
- [x] 2. Repair and verify all five mobile approach cards.
- [x] 3. Update contacts, experience, metrics, and contact form copy.
- [ ] 4. Verify validation, error data retention, and delivery in an agreed test environment.

## P1 - Positioning and cases

- [ ] 5. Redesign the home page, move the portrait to About, and agree on visual direction.
- [ ] 6. Verify typography, contrast, keyboard access, and reduced motion.
- [x] 7. Repair previews, actions, and catalog filters.
- [ ] 8. Create three agreed cases after confirming roles and permitted materials.

## P2 - Journey and acceptance

- [x] 9. Reduce repetition, explain the process, and update the 404 page.
- [ ] 10. After publication, agree on analytics and evaluate hypotheses.
- [ ] 11. Run user journeys, project checks, and visual acceptance; record limitations.

## Verification notes

- Clean staged snapshot: `npm run check` passed with one unused-import hint; `npm run test:unit` passed 54 tests; `npm run format:check` passed; `npx playwright test --reporter=line` passed 68 Chromium tests. The Playwright web server runs a production build first.
- Viewport tests cover the plan widths and a 640 CSS px reflow approximation for 200% zoom. Actual browser zoom, screen reader, contrast measurement, and physical device checks remain open.
- SMTP delivery remains unverified until a configured test environment is available.
- The project overview pages intentionally leave personal contribution and permitted screenshots unconfirmed; do not treat them as three completed case studies.
- The user has not yet approved the visual direction. The site has not been published.

