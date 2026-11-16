'use strict';

// The research lives in JSON; JavaScript builds every table row and source link.
function makeLink(label, url) {
    const link = document.createElement('a');
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('Expected an HTTPS source URL.');
    link.href = parsed.href;
    link.textContent = label;
    return link;
}

function makeCell(data) {
    const cell = document.createElement('td');
    const description = document.createElement('p');
    description.textContent = data.text;
    cell.append(description);
    const sources = document.createElement('ul');
    sources.className = 'sources';
    data.sources.forEach(source => {
        const item = document.createElement('li');
        item.append(makeLink(source.label, source.url));
        sources.append(item);
    });
    cell.append(sources);
    return cell;
}

async function loadComparison() {
    const status = document.getElementById('status');
    try {
        const response = await fetch('data/cms.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.systems) || data.systems.length < 5) {
            throw new Error('Expected at least five CMS records.');
        }
        const rows = document.createDocumentFragment();
        data.systems.forEach(system => {
            const row = document.createElement('tr');
            const name = document.createElement('th');
            name.scope = 'row';
            name.append(makeLink(system.name, system.url));
            row.append(name);
            ['support', 'technology', 'capabilities', 'limitations', 'examples'].forEach(key => {
                row.append(makeCell(system[key]));
            });
            rows.append(row);
        });
        document.getElementById('cms-rows').replaceChildren(rows);
        document.getElementById('research-date').textContent = `research reviewed ${data.researched}`;
        document.getElementById('comparison').hidden = false;
        status.textContent = `${data.systems.length} content management systems loaded from the external JSON file.`;
    } catch (error) {
        status.textContent = 'The comparison could not load. Refresh to try again, or use the JSON link above. For local previews, serve this folder over HTTP instead of opening the HTML as a file.';
        console.error('CMS comparison:', error);
    }
}

loadComparison();
