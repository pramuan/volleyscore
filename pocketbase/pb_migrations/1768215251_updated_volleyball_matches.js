/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3758181470")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "file2689287793",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/png",
      "image/vnd.mozilla.apng",
      "image/jpeg",
      "image/webp"
    ],
    "name": "backgroundImage",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3758181470")

  // remove field
  collection.fields.removeById("file2689287793")

  return app.save(collection)
})
