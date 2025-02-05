---
title: "CLI tips"
date: 2023-07-13
updated: 2024-12-08
summary: "misc CLI stuff"
tags:
  - dev
---

## Prettier terminal

Either install a modern terminal like [Warp](https://www.warp.dev/), or do the following to jazz up any terminal.

Install a [nerd font](https://www.nerdfonts.com/#home) - these have glyphs (icons) built in, then  a [better prompt like starship](https://starship.rs/) to make use of those glyphs:

```sh
brew install font-caskaydia-cove-nerd-font
brew install starship
```




## Env var
Add environment variables:

```
# add eng vars
export pton_user="use@somedomain.com"
export pton_password="my_strong_password"
```

Read in changes in the .zshrc profile:

```
source .zshrc
```
