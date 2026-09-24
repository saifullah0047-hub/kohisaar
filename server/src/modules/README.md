# Domain Modules

The API is divided into domain boundaries so each module can own its routes, validation, service layer, and persistence adapter:

- auth: authentication and session contracts
- users: profile and account contracts
- products: catalog contracts
- categories: catalog taxonomy contracts
- cart: cart contracts
- orders: order lifecycle contracts
- payments: payment provider boundary, intentionally unimplemented
- reviews: customer review contracts
- content: editorial content contracts
- admin: privileged management contracts

No domain routes or mock data are exposed until the corresponding requirements and persistence models are approved.
