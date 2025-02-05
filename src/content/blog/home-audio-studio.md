---
title: Song making at home, kids edition
date: 2024-11-22
summary: Making music 101
tags:
  - music
  - kids
---

The problem of sending kids to music lessons is that one day, they and their friends want to make a song. Then two. Possibly a whole album.

So I have kids playing instruments, in my case drums, piano, guitar, bass and singing, split across multiple houses and times, and nobody really has a room fit for a studio, plus its a pain to transport drum kits around.

So the very simplest thing would have been to get everyone in the same room, they play a song, you record, and prestro, job done! But the days of kids forming a band in their parents garage are fading, we need more digital solutions.

Which lead me to the question **what does it mean to record a song, anyways?** And its not straightforward to answer, as it seems to learn anything there are millions of competing youtube videos to watch. Hence this writeup.

Today, to make a song, usually each part of the song is produced and recorded separately, than brought together into some kind of digital machine, processed, and mashed up together.

# Capture the sounds being made

So the music is being made, with instruments in different places. How to capture them?

First up, some key requirements for whatever captures the sound:

- 2 inputs - even for a solo musician, sometimes you want to sing and play at the same time.
- [32 bit audio](https://zoomcorp.com/en/us/news/32-bit-float-everything-you-need-to-know/) - this is a relatively new thing in cheaper recorders, and means that the range goes from very soft to very loud.
  - removes the need to set the gain or clip during recording, which is useful for beginners, as I always found it a pain to set the gain and clip every time
  - however you now need to handle it on post for every clip. Which is both a pain and a good thing, as when recording music, the different instrument and vocals need to be normalized anyways.

## Audio interface

This is the thing which captures the sound in high fidelity. It connects directly to an instrument or to a microphone which picks up the vocals or instrument.
### Portable capture 

[H4essential](https://zoomcorp.com/en/jp/handy-recorders/handheld-recorders/h4essential/) - a portable recorder with two mics built in, and 2 XLR/TRS inputs. If you get this, then you don't also need a computer audio interface - the H4 doubles as a field recorder and a computer interface.

Resources:

- [Quick Start: Zoom H4essential audio recorder](https://www.youtube.com/watch?v=D0Cqs_-5IG4)
- [Manual (html)](https://zoomcorp.com/manuals/h4essential-en/)

### Capture straight to computer

An audio interface has inputs and outputs and plugs into a computer or ipad. Androids aren't in the creative chat, its a computer or ipad. All good home studios have a multiple input audio interface.

There are single recording interfaces, but 2 instruments at the one time seems to be the nudget sweetspot, especially as sometimes you need both inputs to record in stereo.

| Item                                                                                   | Price (AUD)                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Notes                                                         |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Volt 2 USB Recording Studio](https://www.uaudio.com/uad-plugins/volt-2-usb.html)      | [$289](https://www.google.com/search?sca_esv=03e995a0e07cb544&sxsrf=ADLYWIJD-Y2aeaIiN8xBBCNFOwnJW0lrMQ:1732062040023&q=volt+2+usb+recording+studio&udm=28&fbs=AEQNm0CrHVBV9axs7YmgJiq-TjYc7RgyMjmhctvLCnk5YpVfOzTk9UgrCkq1LL6wECoQ_WEFKodFZzrO9Rycr6gzIIE_GE6faBIVW8AaN8pHu7JsvCEmwb_2EUGbzaH5rxuISXp5Ba3QnSxmNxAmlx22SlSvcCkhT3CpgZ4BISVFLYcMDinYKoOu3MpNdraF7tzp0CwgCYFAtacqOvW21VXAysPWvOkZDw&ved=1t:220175&ictx=111&biw=1280&bih=1294&dpr=2)               | Good company, better than Focusrite?                          |
| [Focusrite Scarlett 2i2 (4th Generation)](https://focusrite.com/products/scarlett-2i2) | [$299](https://www.google.com/search?sca_esv=03e995a0e07cb544&sxsrf=ADLYWIJD-Y2aeaIiN8xBBCNFOwnJW0lrMQ:1732062040023&q=volt+2+usb+recording+studio&udm=28&fbs=AEQNm0CrHVBV9axs7YmgJiq-TjYc7RgyMjmhctvLCnk5YpVfOzTk9UgrCkq1LL6wECoQ_WEFKodFZzrO9Rycr6gzIIE_GE6faBIVW8AaN8pHu7JsvCEmwb_2EUGbzaH5rxuISXp5Ba3QnSxmNxAmlx22SlSvcCkhT3CpgZ4BISVFLYcMDinYKoOu3MpNdraF7tzp0CwgCYFAtacqOvW21VXAysPWvOkZDw&ved=1t:220175&ictx=111&biw=1280&bih=1294&dpr=2)               | Can't go wrong, recommended for ages. Auto gain and auto clip |
| [Behringer UMC22](https://www.behringer.com/product.html?modelCode=0805-AAJ)           | [$79](https://www.google.com/search?sca_esv=03e995a0e07cb544&rlz=1C5CHFA_enAU1067AU1067&sxsrf=ADLYWIJ9KRllZdp6DszZH8_KCHtXjb8gxA:1732062385512&q=Behringer+UMC22&udm=28&fbs=AEQNm0CrHVBV9axs7YmgJiq-TjYc7RgyMjmhctvLCnk5YpVfOzTk9UgrCkq1LL6wECoQ_WF4q-XzRghc-uyPCzdGrsazUA90n_aI-wEOKzRhNzmq62tV5JTm9oTI52Vr9HL28jFKBSZFArlr_MirR7z2Ow4YBeErbCCx9y7YbTZjTA71toNVWvZcRwUDHK4UAEI87PpLfXEG8rsC66JSrpccq0VUvtw3EA&ved=1t:220175&ictx=111&biw=1280&bih=1294&dpr=2) | Budget option, seems fine, some noise about reliability       |

I went with the Focusrite, since its been recommended for ages and its made it a 4th gen, so hopefully they have fixed all the major issues found from 1-3.

# Make the sounds

## Old school human powered sounds

The typical way, and for this guide, hopefully mostly, is humans banging or strumming away on an instrument to make sound. A basic setup:

### Acoustic Guitar

[Yamaha APXT2 3/4](https://au.yamaha.com/en/products/musical_instruments/guitars_basses/ac_guitars/apx-t/index.html) electro acoustic. This is a standard 3/4 guitar with a built in active preamp and pickup, which makes it easy to record this by plugging in a [1/4" TS Cable](https://www.amazon.com.au/gp/product/B00Y44AARQ/ref=ox_sc_act_title_1?smid=AJ0L91KOBUX7C&th=1).

Electric Guitar: They generally have a 1/4" TS output, one more 1/4" TS cable.

### Drums

[Alesis Mesh Nitro](https://www.alesisdrums.com/electronic-drum-kits/nitro-mesh-kit/)

The drum module has a headphone, Dual 1/4 and midi output. I have speakers/headphones connected to the headphone output, and use a dual 1/4 TS cable plugged into my recorder to 1/4 inch TRS cable (plugged into the drums)

The [Alesis manual](https://www.alesis.com/rscdn/1886/documents/Nitro%20Drum%20Module%20-%20User%20Guide%20-%20v1.2.pdf) says:

> Outputs: Use standard 1/4" TRS cables to connect these outputs to a speaker or amplifier system. The level of these outputs is controlled by the Volume knob.
### Keyboard

[Yamaha NP-12](https://au.yamaha.com/en/products/musical_instruments/keyboards/piaggero/np-32_12/index.html) 61 keys keyboard. This has a 1/4 inch TRS output, so to record this I am using a 1/4 Inch TRS Stereo to Dual 1/4 Inch TS Cable. Why a dual 1/4 TS? Case the field recorder or audio interface have TS inputs, so to record stereo you need to record L and R to seperate inputs.

The issue here is: 

### Vocals

Any mic with a [XLR Male to Female Microphone Cable](https://www.amazon.com.au/AmazonBasics-Male-Female-Microphone-Cable/dp/B01JNLTTKS?ref_=ast_sto_dp&th=1).

My Zoom H4e recorder has 

## Machines aka electronic sounds

We have more and more and more of this in today's music - all kinds of electronic noise/sound. This is a whole topic in itself, quick summary of options here:

- **download samples** e.g [Bandlab](https://www.bandlab.com/) which has tons of samples, as do most audio editors, or use a AI generator to craft the perfect sample.
- **make samples** on an app
  - Android: [Koala Sampler](https://www.koalasampler.com/)
  - IOS: [Ableton Note](https://www.ableton.com/en/note/), [Flip Sampler](https://www.flipsampler.com/) or [Auxy Studio](https://auxy.co/)
  - Mac/PC: Every daw has built in instruments to make sounds with.
- **hardware** - optional, quite expensive, not worth it for beginners
  - budget: [Akai MPK Mini play](https://www.akaipro.com/mpk-mini-play-mpkminiplay) - has 128 Midi sounds built in and 9 drum sets.
  - expensive: [EP–133 K.O. II](https://teenage.engineering/store/ep-133/), [SP404 MKII](https://www.roland.com/global/products/sp-404mk2/) to sample and distort bits of sounds into interesting things to add to your song, o



## Recording aka microphone

First up, you need at least one microphone.

[Shure SM58](https://www.shure.com/en-ASIA/products/microphones/sm58) leans more towards vocals but can do everything. Its a dynamic microphone and doesn't need phantom power. It has a tough metal grill with built in pop filter. This is a super tough, do it all mike.

Budget pick: [Behringer XM8500](https://www.behringer.com/product.html?modelCode=0502-AAA) at [$30 AUD](https://www.google.com/search?sca_esv=03e995a0e07cb544&rlz=1C5CHFA_enAU1067AU1067&sxsrf=ADLYWIIuHX7zYdBk8HutxsORwXH_xzXwsw:1732062814915&q=Behringer+XM8500&udm=28&fbs=AEQNm0CrHVBV9axs7YmgJiq-TjYc7RgyMjmhctvLCnk5YpVfOzTk9UgrCkq1LL6wECoQ_WEFKodFZzrO9Rycr6gzIIE_GE6faBIVW8AaN8pHu7JsvCEmwb_2EUGbzaH5rxuISXp5Ba3QnSxmNxAmlx22SlSvcCkhT3CpgZ4BISVFLYcMDinYKoOu3MpNdraF7tzp0CwgCYFAtacqOvW21VXAysPWvOkZDw&ved=1t:220175&ictx=111&biw=1280&bih=1294&dpr=2)is 6 times cheaper than the SM58! ! It compares well with the SM58, only knocks against it are being less rugged.



# Listening

Get something with a flat sound curve. You definitely need headphones, studio monitors are nice but optional.

## Headphones

Get headphones with a wire. Plug into the

## Studio Monitors

- Rockit 5s - a bit big

# Making the song

So now means to capure and listen to audio. We need a tool to go through all these captures, listen, select, put together and make a song.

This tool is called a Digital Audio Workstation, or DAW for short. Its a scary sounding name, but its just another piece of software. Imagine we called MS Word a Digital Words Workstation. People would be scared of writing and typing wages would sky rocket.

So we need to choose some software, then the appropirate machine to run it on.

## Cloud

[BandLab](https://www.bandlab.com/) is seriously impressive. Most people can stop right here and just use this. There are other cloud DAW's, but nothing compares to BandLab. The free version of Bandlab is very powerful, though you would need the $99/yr subscription sooner or later.

So if you're not technically savvy or want to mess around with computers and stuff, then stop here and use Bandlab.

I am, however, going to stick with the past and use a more traditional hardware setup of a laptop and offline software. If the song making continues, you would need that anyways, but even at the basic phase where a phone app or cloud site will do, I feel making music on a computer also teaches a lot of valuable computer skills.

## Hardware aka the computer

A base model [Macbook Air M1] is sufficient to run a daw and record all the things. You can get this used somewhat cheaply, though I had one so all I had to do was create a child profile. I really like the base model [Mac Mini M4](https://www.theverge.com/24289730/apple-mac-mini-m4-review) - this is a editing wonderland, but then you are stuck to a desk.

PC's are just fine too, on a tight budget I would take any old machine, not too slow, install [Pop!OS](https://pop.system76.com/) on it and [Reaper](https://www.reaper.fm/). Talking of budget, these days getting a base model education priced [mac mini](https://buyersguide.macrumors.com/#Mac_Mini) is the cheapest value pc you can buy and would last years, and handle the heaviest song making workflow like a champ.

## Software

[Garageband](https://www.apple.com/au/mac/garageband/) - free with every mac and ipad. Start here if you have either. If outgrowing this, Apple's [Logic Pro](https://www.apple.com/au/logic-pro/) is an easy upgrade.

Other DAWS worth exploring (all run on mac/pc/linux):

[Ableton Live](https://www.ableton.com/en/live/) - this is awesome, 149 for the intro version, 529 for Standard, and a 50% edu discount.

[Audacity](https://www.audacityteam.org/) - free and open source, owned by [musehub](https://www.musehub.com/). v4 is looking like a major upgrade and should be out in 2025. Not quite a full DAW... but very handy tool to have.

[Reaper](https://www.reaper.fm/) - created by Justin Frankel of winamp fame, I really like this one. Can use in trial mode forever, $60 once ready to buy.

### Ipad apps

## Distribute your music

Free - youtube
Put your album on [Spotify](https://distrokid.com/spotify/?utm_source=s4aDirectory), via a service like [DistroKid](https://distrokid.com) or [CDBaby](https://cdbaby.com/music-distribution/get-on-spotify/)

## Resources

- [Home Recording Newbie forums](https://homerecording.com/bbs/forums/newbies.3/)
