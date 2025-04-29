# Ticket Booking System

## Overview

The system allows users to view, reserve, and purchase tickets for events. Each event has event zones, and each zone has a specific number of tickets.

## Models

### EventZone

- `id`: Unique identifier
- `eventId`: ID of the event
- `name`: Name of the zone (e.g., "VIP", "Regular")
- `price`: Price of tickets in this zone
- `currency`: Currency for the price
- `seatCount`: Number of seats in the zone
- `tickets`: Relationship to tickets in this zone

### Ticket

- `id`: Unique identifier
- `eventZoneId`: ID of the event zone
- `seatNumber`: Seat number (1 to seatCount)
- `price`: Price of the ticket
- `status`: Current status (AVAILABLE, RESERVED, SOLD)
- `soldTicket`: Relationship to sold ticket record (if sold)

### SoldTicket

- `ticketId`: ID of the sold ticket
- `buyerId`: ID of the user who bought the ticket
- `soldAt`: Date and time when the ticket was sold
- `ticket`: Relationship to the ticket
- `buyer`: Relationship to the buyer

## Workflow

1. **Event Creation**: When a new event is created, tickets are automatically generated for each event zone.

2. **Viewing Available Tickets**:

   - Endpoint: `GET /events/:eventId/tickets`
   - Optional query parameter: `zoneId` to filter by specific zone
   - Returns all available tickets for the event

3. **Reserving Tickets**:

   - Endpoint: `POST /events/tickets/:ticketId/reserve`
   - Requires authentication
   - Marks the ticket as RESERVED

4. **Purchasing Tickets**:

   - Endpoint: `POST /events/tickets/:ticketId/purchase`
   - Requires authentication
   - Changes ticket status to SOLD
   - Creates a SoldTicket record linking the ticket to the buyer

5. **Releasing Reserved Tickets**:

   - Endpoint: `DELETE /events/tickets/:ticketId/reserve`
   - Changes ticket status back to AVAILABLE if it was RESERVED

6. **Viewing User's Tickets**:
   - Endpoint: `GET /events/user/tickets`
   - Requires authentication
   - Returns all tickets purchased by the user

## Implementation Notes

- The system enforces unique seat numbers within each event zone
- Appropriate error handling for edge cases (ticket not found, already sold, etc.)
- Transactions used for purchase operations to ensure data integrity
