---
title: Jupyter Lab tips and tricks
date: 2019-08-04
tags:
  - jupyter
---

My collection of tips and tricks for using jupyter lab.

[Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/) is already installed with [Anaconda](https://www.anaconda.com/distribution/), but if using miniconda install it by:

`conda install -c conda-forge jupyterlab ipywidgets`

## magic commands

list all magic commands: `%lsmagic`

My shortlist:

- Load a file: `%load ./hello_world.py`
- time a cell: `%%time`

## Extensions

- [Table of Contents](https://github.com/jupyterlab/jupyterlab-toc) - displays a toc in the sidebar.
- [Go to Definition](https://github.com/krassowski/jupyterlab-go-to-definition) - `ctrl-alt-b` jumps to the point in the notebok the variable or function is defined

[Jupyterlab extensions](https://www.npmjs.com/search?q=keywords:jupyterlab-extension) are built using nodejs, so install that by:

Step 1: install nodejs using [volta](https://volta.sh/):

```bash
# install Volta
curl https://get.volta.sh | bash

# install Node
volta install node

# start using Node
node
```

Install all the extensions then build in one go by:

```
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build && \
jupyter labextension install @jupyterlab/toc --no-build && \
jupyter lab build --minimize=False
```

Note: the build flag is because building was taking too long without this.

## blog with jupyter notebooks

So there are tools like Pelican which are setup directly with jupyter notebooks, but I had already set up a hugo powered blog since its free, easy and just works, so my mini shortcut is to put all my notebooks the hugo content directory and run a little script there which converts the jupyter notebooks to markdown files:

```python
import os

# path to jupyter notebooks
path = 'content/'

# Find all jupyter notebooks in the content folder (and its subfolders)
all_ipynb_files = [os.path.join(root, name)
                   for root, dirs, files in os.walk(path)
                       for name in files
                           if name.endswith((".ipynb"))]

# Remove all notebooks from checkpoint folders
ipynb_files = [x for x in all_ipynb_files if ".ipynb_checkpoints" not in x]

# converting to markdown, one at a time
for notebook in ipynb_files:
    os.system(f'jupyter nbconvert --to markdown {notebook}')

print(f"Converted {len(ipynb_files)} jupter notebooks to markdown.")
```

The above works just fine, but i had a problem: the web server wasn't displaying images from the jupyter notebook posts.

One solution is to go through every markdown file and fix the link so it points to the right file, but the easiest solution Google found me was this:

In the nbconvert config file `~/.jupyter/jupyter_nbconvert_config.py` put the following line:

`c.NbConvertApp.output_files_dir = '{notebook_name}'`

This saves the output file in a folder which is the same as the notebook name - I've found that way then the netlify webserver just serves up the image files without having to rewrite the image path inside the markdown file.

_Note: this post is a work in progress..._
