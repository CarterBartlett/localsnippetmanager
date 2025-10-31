document.addEventListener('DOMContentLoaded', () => {

    const snippetEditor = {
        title: document.getElementById('snippet-title'),
        content: document.getElementById('snippet-content'),
        id: document.getElementById('snippet-id'),
        saveRequired: false
    }
    const btnSaveSnippet = document.getElementById('btn-save-snippet');
    const btnAddSnippet = document.getElementById('btn-add-snippet');
    const btnCopySnippet = document.getElementById('btn-copy-snippet');
    const iconUnsaved = document.getElementById('icon-unsaved');
    const alertConfirmationBox = document.getElementById('confirmation-box');
    const saveConfirmationBox = document.getElementById('save-confirmation-box');
    const btnExportLibrary = document.getElementById('btn-export-library');
    const btnImportLibrary = document.getElementById('btn-import-library');

    btnAddSnippet.addEventListener('click', () => {
        snippet = createSnippet();
        loadSnippet(snippet.id);
    });
    btnSaveSnippet.addEventListener('click', () => {
        const title = snippetEditor.title.value;
        const content = snippetEditor.content.value;
        const id = parseInt(snippetEditor.id.value, 10);
        saveSnippet(id, title, content);
    });
    btnCopySnippet.addEventListener('click', () => {
        navigator.clipboard.writeText(snippetEditor.content.value);
    });

    btnExportLibrary.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snippets));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "snippets.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    btnImportLibrary.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                displayConfirmationBox('Importing a snippet library will overwrite your current snippets. Are you sure you want to continue?', () => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedSnippets = JSON.parse(e.target.result);
                            snippets = importedSnippets;
                            localStorage.setItem('snippets', JSON.stringify(snippets));
                            loadSnippetsList();
                            clearSnippetEditor();
                            setSnippetEditorEnabled(false);
                        } catch (error) {
                            alert('Error importing file: Invalid JSON format');
                        }
                    };
                    reader.readAsText(file);
                }, () => {
                    // User canceled
                });
            }
        });
        fileInput.click();
    });

    // Enable tab insertion in textarea
    snippetEditor.content.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = snippetEditor.content.selectionStart;
            const end = snippetEditor.content.selectionEnd;
            snippetEditor.content.value = snippetEditor.content.value.substring(0, start) + "\t" + snippetEditor.content.value.substring(end);
            snippetEditor.content.selectionStart = snippetEditor.content.selectionEnd = start + 1;
        }

        // Handle Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const title = snippetEditor.title.value;
            const content = snippetEditor.content.value;
            const id = parseInt(snippetEditor.id.value, 10);
            if (id) {
                saveSnippet(id, title, content);
            }
        }
    });

    // Check for unsaved changes on input
    snippetEditor.content.addEventListener('input', () => {
        const storedSnippet = snippets.find(s => s.id === parseInt(snippetEditor.id.value));
        if (storedSnippet && !snippetEditor.saveRequired && (snippetEditor.title.value !== storedSnippet.title || snippetEditor.content.value !== storedSnippet.content)) {
            snippetEditor.saveRequired = true;
            iconUnsaved.hidden = false;
        }
    });

    snippets = JSON.parse(localStorage.getItem('snippets')) || [];
    loadSnippetsList();

    function createSnippet() {
        const snippet = {
            id: Date.now(),
            title: 'Untitled',
            content: ''
        };
        snippets.push(snippet);
        localStorage.setItem('snippets', JSON.stringify(snippets));
        return snippet;
    }

    function loadSnippet(id) {
        snippet = snippets.find(s => s.id === id);
        if (snippet) {
            snippetEditor.title.value = snippet.title;
            snippetEditor.content.value = snippet.content;
            snippetEditor.id.value = snippet.id;
            setSnippetEditorEnabled(true);
            snippetEditor.content.focus();

            snippetEditor.saveRequired = false;
            iconUnsaved.hidden = true;
        }
        loadSnippetsList();
    }

    function deleteSnippet(id) {
        snippets = snippets.filter(s => s.id !== id);
        localStorage.setItem('snippets', JSON.stringify(snippets));

        if (parseInt(id) === parseInt(snippetEditor.id.value)) {
            clearSnippetEditor();
            setSnippetEditorEnabled(false);
        }

        loadSnippetsList();
    }

    function saveSnippet(id, title, content) {
        const snippet = snippets.find(s => s.id === parseInt(id));
        if (snippet) {
            console.log('Snippet triggered');
            snippet.title = title;
            snippet.content = content;
            localStorage.setItem('snippets', JSON.stringify(snippets));
            snippetEditor.saveRequired = false;
            iconUnsaved.hidden = true;
            loadSnippetsList();
        }
    }

    function loadSnippetsList() {
        const list = document.getElementById('snippets-ul');
        list.innerHTML = '';
        snippets.forEach(snippet => {
            const li = document.createElement('li');
            li.textContent = snippet.title;
            
            li.addEventListener('click', () => {
                if (snippet.id === snippetEditor.id.value) return;
                if (snippetEditor.saveRequired) {
                    displaySaveConfirmationBox(
                        ()=> {
                            console.log(snippetEditor);
                            saveSnippet(snippetEditor.id.value, snippetEditor.title.value, snippetEditor.content.value);
                            loadSnippet(snippet.id);
                        },
                        ()=> {
                            loadSnippet(snippet.id);
                        },
                        ()=> {
                            // User canceled
                        }
                    )
                } else {
                    loadSnippet(snippet.id);
                }
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.addEventListener('click', () => {

                displayConfirmationBox('Are you sure you want to delete this snippet?', () => {
                    deleteSnippet(snippet.id);
                }, () => {
                    // User canceled
                });
            });

            if (parseInt(snippet.id) === parseInt(snippetEditor.id.value)) {
                li.classList.add('selected');
            }
            
            li.appendChild(deleteBtn);
            list.appendChild(li);
        });
    }

    function clearSnippetEditor() {
        snippetEditor.id.value = '';
        snippetEditor.title.value = '';
        snippetEditor.content.value = '';
        snippetEditor.title.disabled = true;
        snippetEditor.content.disabled = true;
        snippetEditor.saveRequired = false;
    }

    function setSnippetEditorEnabled(enabled) {
        snippetEditor.title.disabled = !enabled;
        snippetEditor.content.disabled = !enabled;
        btnSaveSnippet.disabled = !enabled;
        btnCopySnippet.disabled = !enabled;
    }

    function displayConfirmationBox(message, onConfirm, onCancel) {
        const displayText = alertConfirmationBox.querySelector('h1.displaytext');
        const btnOk = alertConfirmationBox.querySelector('.btn-ok');
        const btnCancel = alertConfirmationBox.querySelector('.btn-cancel');

        displayText.textContent = message;
        btnOk.onclick = () => {
            onConfirm();
            alertConfirmationBox.style.display = 'none';
        };
        btnCancel.onclick = () => {
            onCancel();
            alertConfirmationBox.style.display = 'none';
        };

        alertConfirmationBox.style.display = 'flex';
    }

    function displaySaveConfirmationBox(onSave, onNoSave, onCancel) {
        const btnSave = saveConfirmationBox.querySelector('.btn-save');
        const btnNoSave = saveConfirmationBox.querySelector('.btn-nosave');
        const btnCancel = saveConfirmationBox.querySelector('.btn-cancel');

        btnSave.onclick = () => {
            onSave();
            saveConfirmationBox.style.display = 'none';
        };
        btnNoSave.onclick = () => {
            onNoSave();
            saveConfirmationBox.style.display = 'none';
        };
        btnCancel.onclick = () => {
            onCancel();
            saveConfirmationBox.style.display = 'none';
        };

        saveConfirmationBox.style.display = 'flex';
    }
});