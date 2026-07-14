---
date: 2023-12-02
tags:
  - python
---
[python-dotenv](https://github.com/theskumar/python-dotenv) makes it easy to read in secrets from env or a `.env` file in the project folder.

```py
from dotenv import load_dotenv
load_dotenv()  # take environment variables
```

Now `os.getenv("KEY")` will load env keys first from the `.env` file in the script dir (or project root), and if not found there load it from the environment.