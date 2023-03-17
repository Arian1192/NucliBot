import pkg from '@slack/bolt'
import express from 'express'
const { App } = pkg
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { formatDate } from './utils/dataConverter.js'
import {getOnlyBookingsAvailable} from "./utils/getOnlyBookingsAvailable.js";
import bodyParser from "body-parser";
dotenv.config()

const expressApp = express()
const PORT = process.env.EXPRESS_PORT || 8080
expressApp.post('/slack/hourSelected', (req,res) =>{
    const body = req.body
    console.log(body)
    res.status(200).json({message: true})
})

expressApp.use(bodyParser.json())
expressApp.listen(PORT, () => {
    console.log(`Server express listening on port ${PORT}`)
})


// const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/home/arian/Dev/pruebas/Nucli/credentials.json'
const API_KEY_TIMETIME = process.env.API_KEY_TIMETIME


const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    signingSecret: process.env.SLACK_SIGNIGN_SECRET,
    appToken: process.env.SLACK_APP_TOKEN
})


const UpNuclio = async () => {
    await app.start(process.env.PORT || 3000)
}


app.command('/available_meetings', async ({
    ack, body, client
}) => {

    try {
        let dia = ''
        dia = formatDate(new Date())
        const response = await fetch(`https://api.timetime.in/v1/event-types/058c85c2-f0e2-42a8-8adf-a60a9926ef95/availability/?from=${dia}&days=3`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (response.ok) {
            let options;
            try{
            const data = await response.json()
                const bookingAvailable = getOnlyBookingsAvailable(data.timeSlots)
                options = bookingAvailable.map((meeting) => {
                    const date = new Date(meeting.start)
                    let dateFormated = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
                    return {
                        text: {
                            type: "plain_text",
                            text: dateFormated
                        },
                        value: meeting.start
                    };
            })
            }catch (error){
                console.log(error)
            }
            await ack()
            await client.views.open({
                trigger_id: body.trigger_id,
                view: {
                    type: "modal",
                    callback_id: "available_meetings_modal",
                    title: {
                        type: "plain_text",
                        text: "Available Hours"
                    },
                    submit: {
                        type: "plain_text",
                        text: "Submit",
                        emoji: true
                    },
                    close: {
                        type: "plain_text",
                        text: "Cancel",
                        emoji: true
                    },
                    blocks: [
                        {
                            type: "input",
                            label: {
                                type: "plain_text",
                                text: "Coloca aqui las dudas que quieres preguntarle al mentor :man-shrugging:"
                            },
                            element: {
                                type: "plain_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "No puedo renderizar este componente..."
                                }
                            }
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "\t> En esta entrada de texto, puedes escribirle que duda tienes."
                            }
                        },
                        {
                            type: "input",
                            label: {
                                type: "plain_text",
                                text: "Dirección de correo electronico :email:"
                            },
                            element: {
                                type: "email_text_input",
                                placeholder: {
                                    type: "plain_text",
                                    text: "Enter an email"
                                }
                            }
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "\t> This field is required to verify the booking of the mentoring."
                            }
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Available Hours, select your favorite one :tada:"
                            },
                            accessory: {
                                type: "static_select",
                                action_id: "available_meetings",
                                placeholder: {
                                    type: "plain_text",
                                    text: "Select one",
                                },
                                options: options,
                                confirm:{
                                    title:{
                                        type: "plain_text",
                                        text: "Estas de acuerdo con la hora seleccionada?"
                                    },
                                    text:{
                                        type: "mrkdwn",
                                        text: "Si no estas de acuerdo, puedes seleccionar otra hora."
                                    },
                                    confirm:{
                                        type: "plain_text",
                                        text: "Si"
                                    },
                                    deny:{
                                        type: "plain_text",
                                        text: "No",
                                    }
                                }
                            },
                        }
                    ]
                }
            })
        } else {
            console.error(`Error retrieving availability: ${response.statusText}`)
        }
    } catch (error) {
        console.error(error);
    }
})

app.action('available_meetings', async ({
    ack, respond, body, client
}) => {
    await ack()
    const response = fetch('https://hooks.slack.com/services/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', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: true})
    })
})

app.view('available_meetings_modal', async ({
    ack, body, view, client, respond
}) => {
    await ack()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    try {
        const { values } = view.state
        let data = []
        let dataFormated = []
        Object.keys(values).forEach((key) => {
            data.push(values[key])
        })
        for (const key in data) {
            const value = data[key];
            Object.keys(value).forEach((key) => {
                if (value[key].type === 'static_select') {
                    dataFormated.push(value[key].selected_option.value)
                } else {
                    dataFormated.push(value[key].value)
                }
            })
        }

        try {
            const response = await fetch('https://api.timetime.in/v1/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY_TIMETIME}`
                },
                body: JSON.stringify({
                    eventTypeId: "058c85c2-f0e2-42a8-8adf-a60a9926ef95",
                    start: dataFormated[2],
                    bookerEmail: dataFormated[1],
                })
            })
            if (response.ok) {
                const data = await response.json()
                console.log(data)
            }

            //TODO Crear la respuesta para el cliente conforme se ha hecho la reserva correctamente
        }
        catch (error) {
            console.error(error)
        }

    } catch (error) {
        console.error(error)
    }
})
UpNuclio().then(()=>{
    console.log('Up and running slack bot')
})

