/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // remove field
  collection.fields.removeById("json1915095946")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text524178635",
    "max": 0,
    "min": 0,
    "name": "bookingId_",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2940405050",
    "max": 0,
    "min": 0,
    "name": "bookingTitle",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1859822344",
    "max": 0,
    "min": 0,
    "name": "booker",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1923043739",
    "max": 0,
    "min": 0,
    "name": "room",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2862495610",
    "max": 0,
    "min": 0,
    "name": "date",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2351343906",
    "max": null,
    "min": null,
    "name": "failedAttempts",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number582935488",
    "max": null,
    "min": null,
    "name": "remainingAttempts",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "json1915095946",
    "maxSize": 0,
    "name": "details",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // remove field
  collection.fields.removeById("text524178635")

  // remove field
  collection.fields.removeById("text2940405050")

  // remove field
  collection.fields.removeById("text1859822344")

  // remove field
  collection.fields.removeById("text1923043739")

  // remove field
  collection.fields.removeById("text2862495610")

  // remove field
  collection.fields.removeById("number2351343906")

  // remove field
  collection.fields.removeById("number582935488")

  return app.save(collection)
})
