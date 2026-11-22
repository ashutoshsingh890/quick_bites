QUICK BITES CAFE - QR ORDERING
1. Install Node.js (nodejs.org) - nothing else to install.
2. Edit config.json: staffPin, upiId, tables.
3. Run:  node server.js
4. Waiter/owner:  http://localhost:3000/#waiter  (PIN from config.json)
5. Table QRs:     http://localhost:3000/#tables  -> Print
   IMPORTANT: open this page using the address customers will use
   (your public website URL), because the QR contains that address.
GOING LIVE (so customers on mobile data can scan):
   Upload this folder to Render.com / Railway / any VPS ("node server.js" as start command).
   Note: free hosts may reset orders.json on restart; use a small paid plan or VPS.
Change menu/prices: edit menu.json and restart.
