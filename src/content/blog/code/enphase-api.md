---
title: Enlight
summary: Notes on the Enphase API
date: 2024-12-24
draft: true
tags:
  - python
---

Notes on connecting to the [Enphase API](https://developer-v4.enphase.com/). There is a [quick start guide](https://developer-v4.enphase.com/docs/quickstart.html) but it doesn't cover any libraries so this is my even quicker guide.

## Developer account

Create a new application at [https://developer-v4.enphase.com/admin/applications](https://developer-v4.enphase.com/admin/applications) with the following access:

```
System Details
Site Level Production Monitoring
Site Level Consumption Monitoring
```

Save the API Key, Auth URL, Client ID, and Client Secret - I put them in my .zshrc as env variables.

This developer account is seperate from the regular enphase account - dev account is only to manage api keys, and we use the regular enphase account to get auth tokens.

## Enphase-API - python lib

Being lazy, I looked for and found a lib: [https://github.com/Matthew1471/Enphase-API](https://github.com/Matthew1471/Enphase-API)

> Enphase-API is an unofficial project providing an API wrapper (including local/LAN Gateway API) and the documentation for Enphase®'s products and services.
> This project currently predominantly consumes the same local API that the local Gateway web administration portal consumes 

This is exactly what I was looking for - I want to connect to the local gateway and get live data. Looking at the [python api docs](https://github.com/Matthew1471/Enphase-API/blob/main/Documentation/Wrappers/Python/README.adoc) the key steps are:

1. Install Enphase-API

```sh
pip install PyJWT requests Enphase-API
```

Save a `.env` file with the following:

```sh
# enphase user login
ENPHASE_USERNAME="anon.user@gmail.com"
ENLIGHTEN_PASSWORD="your_pass"
ENPHASE_SITE_ID="got-this-from-my-account-details"

# local gateway
IQ_GATEWAY_SERIAL_NUMBER="12345"
IQ_GATEWAY_HOST="https://192.168.86.234" # pin IP on your router
```

Authenticate with the enphase cloud and get back a auth token:

```py
from enphase_api.cloud.authentication import Authentication

# Authenticate with Enphase®'s authentication server and get a token.
authentication = Authentication()
authentication.authenticate(ENPHASE_USERNAME, ENPHASE_PASSWORD)
token = authentication.get_token_for_commissioned_gateway(IQ_GATEWAY_SERIAL_NUMBER)

print(f"Token: {token[:40]}...")
```

Now we can use this token to conenct to the local gateway:

```py
gateway = Gateway(IQ_GATEWAY_HOST)

if gateway.login(token):
    print(f"Logged in to Enphase gateway {IQ_GATEWAY_HOST}")
else:
    print(f"Failed to login to {IQ_GATEWAY_HOST}")

```