import pkg from '@slack/bolt'
const { App } = pkg
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const API_KEY_OPENAI = process.env.API_KEY_OPENAI

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    signingSecret: process.env.SLACK_SIGNIGN_SECRET,
    appToken: process.env.SLACK_APP_TOKEN
})


app.command('/ai', async ({
    command,
    ack,
    respond
}) => {
    const PROMPT = command.text
    console.log(PROMPT)
    await ack()
    await respond("Ahora le pregunto a la ia")
    fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY_OPENAI}`
        },
        body: JSON.stringify({
            "model": "text-davinci-003",
            "prompt": PROMPT,
            "temperature": 0.7,
            "max_tokens": 256,
            "top_p": 1,
            "frequency_penalty": 0.5,
            "presence_penalty": 0
        }),
    })
        .then(response => response.json())
        .then(data => respond(data.choices[0].text))
        .catch((error) => {
            console.error('Error:', error);
        })
})

const UpNuclio = async () => {
    await app.start(process.env.PORT || 3000)
}

UpNuclio()