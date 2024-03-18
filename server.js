const express = require('express')
const fs = require('fs')
const ExifParser = require('exif-parser')
const exif = require('exif').ExifImage

const app = express()

const path = require('path')

app.use(express.static('public'))

const imagesDirectory = './a_aa' // Change this to your images directory

app.get('/images', (req, res) => {
  fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' })
    }

    const imageList = {}

    files.forEach((file, index) => {
      if (
        file.endsWith('.jpg') ||
        file.endsWith('.png') ||
        file.endsWith('.gif') ||
        file.endsWith('.jpeg')
      ) {
        const key = `image${index + 1}`
        const value = `/${file}`
        // const value = `${req.protocol}://${req.get('host')}/images/${file}`
        imageList[key] = value
      }
    })

    fs.writeFile('a_aa.json', JSON.stringify(imageList), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' })
      }
      res.json({ message: 'JSON file created successfully' })
    })
  })
})

app.use('/images', express.static('images'))

// create JSON with an array of Images' adresses
const imagesFolder = path.join(__dirname, 'new_a_aa') // Change 'images' to your actual folder name

app.get('/generate', (req, res) => {
  fs.readdir(imagesFolder, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const imageLocations = files.map((file) => {
      return path.join(`a_aa/${file}`)
    })

    const jsonContent = JSON.stringify({ images: imageLocations })

    fs.writeFile('a_aa.json', jsonContent, 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      return res.json({ message: 'JSON file created successfully' })
    })
  })
})

// Make a copy of Image folder and rename the files
const originalImagesFolder = path.join(__dirname, 'a_a') // Change 'images' to your actual folder name
const newImagesFolder = path.join(__dirname, 'new_a_a')

app.get('/copyrename', (req, res) => {
  fs.mkdir(newImagesFolder, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating folder', err)
      return
    }

    fs.readdir(originalImagesFolder, (err, files) => {
      if (err) {
        console.error('Error reading images', err)
        return
      }

      files.forEach((file, index) => {
        const sourcePath = path.join(originalImagesFolder, file)
        const destinationPath = path.join(
          newImagesFolder,
          `${String(index + 1).padStart(2, '0')}.jpg`
        )

        fs.copyFile(sourcePath, destinationPath, (err) => {
          if (err) {
            console.error('Error copying', err)
          }
        })

        if (index === files.length - 1) {
          console.log('Copying finished')
          return res.json({ message: 'JSON Copying finished' })
        }
      })
    })
  })
})

// exif

// const imagePath = 'test/02.jpg' // Replace with the actual path to your image

app.get('/checktags', (req, res) => {
  const directoryPath = 'test' // Replace with the actual path to your directory
  const outputJsonPath = 'tags2.json'

  const filesWithMetadata = []

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err)
      return
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file)

      try {
        new exif({ image: filePath }, function (error, exifData) {
          if (error) {
            // If error occurs while reading EXIF data, it means the file doesn't have metadata.
            return
          }

          // If no error, it means there's metadata.
          filesWithMetadata.push({ fileName: file, metadata: exifData })
        })
      } catch (error) {
        console.error('Error:', error)
      }
    })

    // Wait for all ExifImage callbacks to finish
    setTimeout(() => {
      const jsonContent = JSON.stringify(filesWithMetadata, null, 2)

      fs.writeFile(outputJsonPath, jsonContent, 'utf8', (err) => {
        if (err) {
          console.error('Error writing JSON file:', err)
          return
        }
        console.log(`JSON file with metadata written to ${outputJsonPath}`)
      })
    }, 1000) // Delay the JSON writing to ensure all callbacks are finished
  })

  // Read the image file
  //   fs.readFile(imagePath, (err, data) => {
  //     if (err) {
  //       console.error('Error reading file:', err)
  //       return
  //     }

  //     const parser = ExifParser.create(data)
  //     const result = parser.parse()

  //     console.log(result)

  //     // remove tags

  //     // if (result.tags) {
  //     //   console.log('Metadata found. Removing...')

  //     //   // Use exif library to remove metadata
  //     //   try {
  //     //     new exif({ image: imagePath }, function (error, exifData) {
  //     //       if (error) {
  //     //         console.error('Error reading EXIF data:', error)
  //     //         return
  //     //       }

  //     //       exifData.image = {}
  //     //       exifData.exif = {}
  //     //       exifData.gps = {}

  //     //       fs.writeFile(imagePath, exifData.getBuffer(), (err) => {
  //     //         if (err) {
  //     //           console.error('Error writing file:', err)
  //     //           return
  //     //         }
  //     //         console.log('Metadata removed successfully.')
  //     //       })
  //     //     })
  //     //   } catch (error) {
  //     //     console.error('Error:', error)
  //     //   }
  //     // } else {
  //     //   console.log('No metadata found in the image.')
  //     // }
  //   })
})

app.get('/sortedJsonData', (req, res) => {
  // Read data from the JSON file
  fs.readFile('streetAndDistrict.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err)
      res.status(500).send('Internal Server Error')
      return
    }

    try {
      // Parse the JSON data
      const jsonData = JSON.parse(data)

      // Sort the data alphabetically by the "street" value
      const sortedData = jsonData.sort((a, b) =>
        a.street.localeCompare(b.street)
      )

      // Create a new JSON file with the sorted data
      const sortedJsonString = JSON.stringify(sortedData, null, 2)
      fs.writeFile('sortedData.json', sortedJsonString, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing file:', writeErr)
          res.status(500).send('Internal Server Error')
        } else {
          console.log('File sortedData.json created successfully.')
          res.send('File sortedData.json created successfully.')
        }
      })
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError)
      res.status(500).send('Internal Server Error')
    }
  })
})

const port = 3000 // Change this to your desired port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
