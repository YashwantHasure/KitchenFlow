KITCHENFLOW — CLOUD KITCHEN PROTOTYPE

FILES
- index.html: application structure
- style.css: layout, colours, responsive styles and print styling
- app.js: fictional data, queue scheduling, validation, tickets and interactions

HOW TO RUN
1. Keep all three files in the same folder.
2. Double-click index.html to open it in Chrome or Edge.
3. Click New order to add an order with dish-level prep times.
4. Use Start prep / Mark ready to change status.
5. Click Ticket to preview a kitchen ticket. Use Copy ticket or Print.
6. Reset demo data restores the original fictional orders.

SCHEDULING ASSUMPTIONS
- The prototype uses fictional sample data only.
- Dish duration within one order is the maximum preparation time among its dishes, assuming parallel preparation.
- A 5-minute packing buffer is added.
- Active orders are prioritised by priority level, then received time, and placed in a serial single-station queue.
- Marking an order Ready removes it from active scheduling.
- This is a classroom demonstration, not a production scheduler. Real kitchens require station-level capacity, order promises, reliable persistence, audit logging, platform integration, and load testing.

TEST IDEAS
- Create a valid order with two dishes.
- Try blank dish names, 0, 181 and decimal preparation times.
- Attempt a duplicate order reference.
- Add several orders and check that active pickup slots are sequential.
- Verify the ticket includes source, reference, dishes, preparation time, status and pickup.
- Test filter, status changes, copy and print.
- Reset demo data.
