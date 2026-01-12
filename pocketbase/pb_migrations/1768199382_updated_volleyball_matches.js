/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3758181470")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "file2610058979",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/webp",
      "image/jpeg",
      "image/vnd.mozilla.apng",
      "image/png"
    ],
    "name": "homeLogo",
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
  collection.fields.removeById("file2610058979")

  return app.save(collection)
})
