<script>
    export let day;
    
    const dayNumber = day.toString().padStart(2, '0');
    
    const repo = "khalido/adventofcode";
    const branch = "master";
    const path = `advent2024/day${dayNumber}.ipynb`;
    
    //view links
    const githubView = `https://github.com/${repo}/blob/${branch}/${path}`;
    const nbviewer = `https://nbviewer.org/github/${repo}/blob/${branch}/${path}`;

    //edit links
    const deepnote = `https://deepnote.com/launch?url=https://github.com/${repo}/blob/${branch}/${path}`;
    const colab = `https://colab.research.google.com/github/${repo}/blob/${branch}/${path}`;
    const binder = `https://mybinder.org/v2/gh/${repo}/${branch}?filepath=${encodeURIComponent(path)}`;
</script>

<span class="font-mono text-sm">
    Day {dayNumber}: 
    <a href={githubView}  target="_blank" rel="noopener noreferrer">view</a>
    | <a href={nbviewer}  target="_blank" rel="noopener noreferrer">nb</a>
    | <a href={colab}  target="_blank" rel="noopener noreferrer">colab</a>
    | <a href={binder}  target="_blank" rel="noopener noreferrer">binder</a>
    | <a href={deepnote}  target="_blank" rel="noopener noreferrer">dn</a>
</span>