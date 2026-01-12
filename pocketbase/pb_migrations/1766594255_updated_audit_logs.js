/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "name": "bookings_audit_logs"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "name": "audit_logs"
  }, collection)

  return app.save(collection)
})
