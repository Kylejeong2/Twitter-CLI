# Post to X from the CLI

Thought of this in the shower lol, inspired by that coffee brand where you can buy coffee from the CLI.

Using Stagehand and Browserbase to automate the browser.

WAY cheaper than using the X api.


## Usage

Run the server:
```
npm run server
```

Run NGROK on http 3000:
```
ngrok http 3000
```

cURL example:
```
 curl -X POST https://c509-24-43-251-139.ngrok-free.app/tweet \
  -H "Content-Type: application/json" \
  -d '{"content":"post on X from the CLI"}'
```

It only has to login the first time you run it, it should save a cookies file to reuse for the future.

doesn't work if you have 2fa on X. (yet)

___________________________________

## Not sure if this is working
Build the CLI:
```
npm run build
```

Post a tweet:

```
npm install -g twitter-cli
twitter-cli post "post on X from the CLI"
```