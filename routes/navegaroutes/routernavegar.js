//importar express
const express = require('express')
const path = require('path')
const cors = require('cors')

//creamos el router para navegacion por url
const navegarRouter = express.Router()

//creamos la ruta para el indice
navegarRouter.get 