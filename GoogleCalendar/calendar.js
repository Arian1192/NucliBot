import {google} from 'googleapis'
import jwtClient from './jwtClient.js'
import dotenv from 'dotenv'
dotenv.config()

dotenv.config()

const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER

const calendar = google.calendar({
    version: 'v3',
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient
})

export default calendar