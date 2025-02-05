---
title: Quote Clock on a Pi Pico
summary: Building a basic quote clock using micropython
date: 2024-04-19
tags:
  - python
toc: true
---

Project notes for building a quote clock using micropython on a Pi Pico W.

Testing a footnote[goog].

## Time

The Pi Pico has no battery and loses its time. Once its on the internet, sync the local clock:

```python
import ntptime
ntptime.settime()
# prints UTC time
print(f"Time: {time.localtime()}")
```

Todo: Convert to local time

## Raspberry Pi Pico W

[MicroPico (aka Pico-W-Go)](https://github.com/paulober/Pico-W-Go) - VS Code extension for Pi Pico boards - this looks excellent, but is quite buggy, I had a lot of issues with it, so stopped using it and instead am using [Thonny](https://thonny.org/ to connect to the pico.

### Disk space

The pico has 2MB of flash memory, but after flashing the Pimoroni rom, only ~800kb of space is free. This caused an issue as I have 1.1MB of quotes in a json file to write. I used gzip to compress this to ~0.5mb, which should fit.

## Future

[goog]: https://google.com
