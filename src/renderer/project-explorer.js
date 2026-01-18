/**
 * Project Explorer Component
 * Handles hierarchical tree view of project structure with file operations
 */

class ProjectExplorer {
    constructor() {
        this.currentProject = null;
        this.expandedFolders = new Set();
        this.selectedItem = null;
        this.contextMenuTarget = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.file-explorer')) {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    handleKeyboardNavigation(e) {
        const allItems = Array.from(document.querySelectorAll('.file-item, .folder-item'));
        const currentIndex = allItems.findIndex(item => item === this.selectedItem);

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateItems(allItems, currentIndex, -1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateItems(allItems, currentIndex, 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (this.selectedItem && this.selectedItem.classList.contains('folder-item')) {
                    const folderPath = this.selectedItem.dataset.path;
                    if (!this.expandedFolders.has(folderPath)) {
                        this.toggleFolder(folderPath);
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (this.selectedItem && this.selectedItem.classList.contains('folder-item')) {
                    const folderPath = this.selectedItem.dataset.path;
                    if (this.expandedFolders.has(folderPath)) {
                        this.toggleFolder(folderPath);
                    }
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedItem && this.selectedItem.classList.contains('file-item')) {
                    const filePath = this.selectedItem.dataset.path;
                    this.openFileFromTree(filePath);
                }
                break;
            case 'Delete':
                e.preventDefault();
                if (this.selectedItem) {
                    this.deleteSelectedItem();
                }
                break;
            case 'F2':
                e.preventDefault();
                if (this.selectedItem) {
                    this.renameSelectedItem();
                }
                break;
        }
    }

    navigateItems(allItems, currentIndex, direction) {
        if (allItems.length === 0) return;

        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : allItems.length - 1;
        } else {
            newIndex = Math.max(0, Math.min(allItems.length - 1, currentIndex + direction));
        }

        if (newIndex !== currentIndex) {
            this.selectItem(allItems[newIndex]);
            allItems[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async loadProject(projectPath) {
        try {
            console.log('ProjectExplorer: Loading project:', projectPath);
            
            if (!window.electronAPI || !window.electronAPI.projectOperations) {
                throw new Error('Electron API not available');
            }

            this.showLoading(true);
            this.updateStatus('Loading project...');

            const project = await window.electronAPI.projectOperations.loadProject(projectPath);
            console.log('ProjectExplorer: Project loaded:', project);

            this.currentProject = project;
            this.expandedFolders.clear();
            this.selectedItem = null;
            
            this.updateFileExplorer();
            this.updateBreadcrumb();
            this.updateStatus(`Loaded project: ${project.rootPath}`);
            
            return project;
        } catch (error) {
            console.error('ProjectExplorer: Failed to load project:', error);
            this.showError('Failed to load project: ' + error.message);
            this.updateStatus('Failed to load project');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    updateFileExplorer() {
        const explorer = document.getElementById('fileExplorer');
        const breadcrumb = document.getElementById('breadcrumb');
        
        if (!this.currentProject || !this.currentProject.files) {
            explorer.innerHTML = `
                <div class="explorer-empty-state">
                    <div class="empty-state-icon">📂</div>
                    <div class="empty-state-title">No Folder Opened</div>
                    <div class="empty-state-subtitle">Open a folder to start exploring your project</div>
                    <div class="empty-state-actions">
                        <button class="welcome-button secondary" onclick="projectExplorer.openFolder()" style="font-size: 12px; padding: 8px 16px;">
                            📁 Open Folder
                        </button>
                    </div>
                </div>
            `;
            breadcrumb.style.display = 'none';
            return;
        }

        console.log('ProjectExplorer: Updating file explorer with', this.currentProject.files.length, 'files');
        
        // Show breadcrumb
        breadcrumb.style.display = 'flex';
        
        explorer.innerHTML = '';
        
        // Build and render file tree
        const fileTree = this.buildFileTree(this.currentProject.files);
        console.log('ProjectExplorer: File tree:', fileTree);
        this.renderFileTree(explorer, fileTree, 0);
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!this.currentProject) return;
        
        const pathParts = this.currentProject.rootPath.split(/[/\\]/);
        const projectName = pathParts[pathParts.length - 1];
        
        breadcrumb.innerHTML = `
            <div class="breadcrumb-item" onclick="projectExplorer.goToRoot()">🏠</div>
            <div class="breadcrumb-separator">›</div>
            <div class="breadcrumb-item">${projectName}</div>
        `;
    }

    goToRoot() {
        // Collapse all folders and scroll to top
        this.expandedFolders.clear();
        this.updateFileExplorer();
        document.getElementById('fileExplorer').scrollTop = 0;
    }

    buildFileTree(files) {
        console.log('ProjectExplorer: Building file tree from files:', files);
        const tree = {};
        
        files.forEach(file => {
            const parts = file.path.split(/[/\\]/);
            let current = tree;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!part) continue; // Skip empty parts
                
                if (i === parts.length - 1) {
                    // It's a file
                    current[part] = {
                        type: 'file',
                        data: file,
                        path: file.path
                    };
                } else {
                    // It's a folder
                    if (!current[part]) {
                        current[part] = {
                            type: 'folder',
                            children: {},
                            path: parts.slice(0, i + 1).join('/')
                        };
                    }
                    current = current[part].children;
                }
            }
        });
        
        console.log('ProjectExplorer: Built file tree:', tree);
        return tree;
    }

    renderFileTree(container, tree, level = 0) {
        console.log('ProjectExplorer: Rendering file tree at level', level, ':', tree);
        
        // Sort items: folders first, then files
        const sortedKeys = Object.keys(tree).sort((a, b) => {
            const aIsFolder = tree[a].type === 'folder';
            const bIsFolder = tree[b].type === 'folder';
            
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.localeCompare(b);
        });
        
        sortedKeys.forEach(key => {
            const item = tree[key];
            
            if (item.type === 'folder') {
                this.renderFolder(container, key, item, level);
            } else {
                this.renderFile(container, key, item, level);
            }
        });
    }

    renderFolder(container, name, folder, level) {
        const isExpanded = this.expandedFolders.has(folder.path);
        
        // Create folder element
        const folderElement = document.createElement('div');
        folderElement.className = `folder-item ${isExpanded ? 'expanded' : ''}`;
        folderElement.style.paddingLeft = (level * 16 + 8) + 'px';
        folderElement.dataset.path = folder.path;
        folderElement.dataset.type = 'folder';
        
        // Check if folder has children
        const hasChildren = Object.keys(folder.children).length > 0;
        
        folderElement.innerHTML = `
            <div class="folder-toggle ${isExpanded ? 'expanded' : ''} ${!hasChildren ? 'empty' : ''}" 
                 style="${!hasChildren ? 'opacity: 0.3; pointer-events: none;' : ''}">
                ${hasChildren ? '▶' : '•'}
            </div>
            <span class="folder-icon ${isExpanded ? 'expanded' : ''}"></span>
            <span class="file-name">${name}</span>
        `;
        
        // Add click handler for folder toggle
        const toggle = folderElement.querySelector('.folder-toggle');
        if (toggle && hasChildren) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFolder(folder.path);
            });
        }
        
        // Add click handler for folder selection
        folderElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('folder-toggle')) {
                this.selectItem(folderElement);
            }
        });
        
        // Add right-click context menu
        folderElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectItem(folderElement);
            this.showContextMenu(e, folder.path, 'folder');
        });
        
        container.appendChild(folderElement);
        
        // Create children container
        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = `folder-children ${isExpanded ? 'expanded' : 'collapsed'}`;
            childrenContainer.dataset.folderPath = folder.path;
            
            if (isExpanded) {
                this.renderFileTree(childrenContainer, folder.children, level + 1);
            }
            
            container.appendChild(childrenContainer);
        }
    }

    renderFile(container, name, file, level) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.style.paddingLeft = (level * 16 + 24) + 'px';
        fileElement.dataset.path = file.path;
        fileElement.dataset.type = 'file';
        
        const ext = file.data.extension ? file.data.extension.toLowerCase() : '';
        let iconClass = 'file-icon';
        
        // Determine file icon class based on extension
        if (ext === '.js' || ext === '.jsx' || ext === '.mjs') iconClass = 'js-file';
        else if (ext === '.ts' || ext === '.tsx' || ext === '.d.ts') iconClass = 'ts-file';
        else if (ext === '.py' || ext === '.pyw' || ext === '.pyi') iconClass = 'py-file';
        else if (ext === '.html' || ext === '.htm' || ext === '.xhtml') iconClass = 'html-file';
        else if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') iconClass = 'css-file';
        else if (ext === '.json' || ext === '.jsonc') iconClass = 'json-file';
        else if (ext === '.txt' || ext === '.text') iconClass = 'txt-file';
        else if (ext === '.yml' || ext === '.yaml') iconClass = 'yml-file';
        else if (ext === '.xml' || ext === '.xsl' || ext === '.xsd') iconClass = 'xml-file';
        else if (ext === '.svg') iconClass = 'svg-file';
        else if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext)) iconClass = 'png-file';
        else if (ext === '.pdf') iconClass = 'pdf-file';
        else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) iconClass = 'zip-file';
        
        // Add file size info for display
        const sizeText = file.data.size ? this.formatFileSize(file.data.size) : '';
        
        fileElement.innerHTML = `
            <span class="${iconClass}"></span>
            <span class="file-name" title="${name}${sizeText ? ' (' + sizeText + ')' : ''}">${name}</span>
            ${sizeText ? `<span class="file-size">${sizeText}</span>` : ''}
        `;
        
        // Add click handler
        fileElement.addEventListener('click', () => {
            this.selectItem(fileElement);
            this.openFileFromTree(file.data);
        });
        
        // Add double-click handler for faster opening
        fileElement.addEventListener('dblclick', () => {
            this.openFileFromTree(file.data);
        });
        
        // Add right-click context menu
        fileElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.selectItem(fileElement);
            this.showContextMenu(e, file.path, 'file');
        });
        
        container.appendChild(fileElement);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    toggleFolder(folderPath) {
        const isExpanded = this.expandedFolders.has(folderPath);
        const folderElement = document.querySelector(`[data-path="${folderPath}"]`);
        const childrenContainer = document.querySelector(`[data-folder-path="${folderPath}"]`);
        const toggle = folderElement?.querySelector('.folder-toggle');
        const icon = folderElement?.querySelector('.folder-icon');
        
        if (!folderElement || !childrenContainer) {
            console.warn('ProjectExplorer: Could not find folder elements for:', folderPath);
            return;
        }
        
        if (isExpanded) {
            // Collapse folder
            this.expandedFolders.delete(folderPath);
            folderElement.classList.remove('expanded');
            toggle?.classList.remove('expanded');
            icon?.classList.remove('expanded');
            childrenContainer.classList.remove('expanded');
            childrenContainer.classList.add('collapsed');
            
            // Animate collapse
            childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
            requestAnimationFrame(() => {
                childrenContainer.style.maxHeight = '0px';
            });
            
            this.updateStatus(`Collapsed folder: ${folderPath.split('/').pop()}`);
        } else {
            // Expand folder
            this.expandedFolders.add(folderPath);
            folderElement.classList.add('expanded');
            toggle?.classList.add('expanded');
            icon?.classList.add('expanded');
            childrenContainer.classList.remove('collapsed');
            childrenContainer.classList.add('expanded');
            
            // Render children if not already rendered
            if (childrenContainer.children.length === 0) {
                const folderData = this.findFolderInTree(this.currentProject.files, folderPath);
                if (folderData && folderData.length > 0) {
                    const tree = this.buildFileTree(this.currentProject.files);
                    const folderNode = this.findFolderNode(tree, folderPath);
                    if (folderNode) {
                        const level = folderPath.split('/').length;
                        this.renderFileTree(childrenContainer, folderNode.children, level);
                    }
                }
            }
            
            // Animate expand
            childrenContainer.style.maxHeight = '0px';
            requestAnimationFrame(() => {
                childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
                setTimeout(() => {
                    childrenContainer.style.maxHeight = '2000px'; // Reset to allow dynamic content
                }, 300);
            });
            
            this.updateStatus(`Expanded folder: ${folderPath.split('/').pop()}`);
        }
    }

    findFolderNode(tree, targetPath) {
        const parts = targetPath.split('/');
        let current = tree;
        
        for (const part of parts) {
            if (current[part] && current[part].type === 'folder') {
                if (current[part].path === targetPath) {
                    return current[part];
                }
                current = current[part].children;
            } else {
                return null;
            }
        }
        return null;
    }

    findFolderInTree(files, folderPath) {
        return files.filter(file => file.path.startsWith(folderPath + '/'));
    }

    selectItem(element) {
        // Remove previous selection
        if (this.selectedItem) {
            this.selectedItem.classList.remove('selected');
        }
        
        // Add selection to new item
        element.classList.add('selected');
        this.selectedItem = element;
    }

    openFileFromTree(fileData) {
        console.log('ProjectExplorer: Opening file from tree:', fileData);
        
        if (!this.currentProject || !fileData) {
            console.error('ProjectExplorer: No project or file data available');
            return;
        }
        
        // Construct the full path properly for the current platform
        const isWindows = this.currentProject.rootPath.includes('\\');
        let fullPath;
        
        if (isWindows) {
            // Windows: convert forward slashes to backslashes
            fullPath = this.currentProject.rootPath + '\\' + fileData.path.replace(/\//g, '\\');
        } else {
            // Unix-like: use forward slashes
            fullPath = this.currentProject.rootPath + '/' + fileData.path;
        }
        
        console.log('ProjectExplorer: Constructed full path:', fullPath);
        
        // Update status to show we're opening the file
        this.updateStatus(`Opening ${fileData.name}...`);
        
        // Emit event for file opening (can be handled by main app)
        if (window.openFileInEditor) {
            window.openFileInEditor(fullPath);
        } else {
            console.warn('ProjectExplorer: openFileInEditor function not available');
        }
    }

    // Context menu functionality
    showContextMenu(event, itemPath, itemType) {
        const contextMenu = document.getElementById('contextMenu');
        this.contextMenuTarget = { path: itemPath, type: itemType };
        
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        
        // Adjust position if menu goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (event.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (event.pageY - rect.height) + 'px';
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
        this.contextMenuTarget = null;
    }

    // File operations
    async createNewFile() {
        if (!this.currentProject) {
            this.showError('Please open a project folder first to create new files');
            return;
        }
        
        const fileName = prompt('Enter file name (with extension):\n\nExamples:\n• index.html\n• script.js\n• style.css\n• README.md');
        if (!fileName) return;
        
        const trimmedName = fileName.trim();
        if (trimmedName === '') {
            this.showError('File name cannot be empty');
            return;
        }
        
        // Validate file name
        if (trimmedName.includes('/') || trimmedName.includes('\\')) {
            this.showError('File name cannot contain path separators. Use folders to organize files.');
            return;
        }
        
        if (trimmedName.includes('..')) {
            this.showError('File name cannot contain ".." for security reasons');
            return;
        }
        
        try {
            // Get the target directory
            let targetDir = this.currentProject.rootPath;
            
            // If a folder is selected, create the file inside it
            if (this.selectedItem && this.selectedItem.classList.contains('folder-item')) {
                const folderPath = this.selectedItem.dataset.path;
                if (folderPath) {
                    targetDir = this.currentProject.rootPath + '/' + folderPath;
                }
            }
            
            const fullPath = targetDir + '/' + trimmedName;
            console.log('ProjectExplorer: Creating new file:', fullPath);
            
            this.showLoading(true);
            this.updateStatus(`Creating file: ${trimmedName}...`);
            
            // Create the file using IPC
            await window.electronAPI.fileOperations.createFile(fullPath);
            console.log('ProjectExplorer: File created successfully');
            this.updateStatus(`Created file: ${trimmedName}`);
            
            // Refresh the explorer to show the new file
            await this.refreshExplorer();
            
            // Try to open the new file in the editor
            setTimeout(() => {
                if (window.openFileInEditor) {
                    window.openFileInEditor(fullPath);
                }
            }, 500);
            
        } catch (error) {
            console.error('ProjectExplorer: Failed to create file:', error);
            if (error.message.includes('already exists')) {
                this.showError(`File "${trimmedName}" already exists. Please choose a different name.`);
            } else {
                this.showError('Failed to create file: ' + error.message);
            }
            this.updateStatus('File creation failed');
        } finally {
            this.showLoading(false);
        }
    }

    async createNewFolder() {
        if (!this.currentProject) {
            this.showError('Please open a project folder first to create new folders');
            return;
        }
        
        const folderName = prompt('Enter folder name:\n\nExamples:\n• components\n• assets\n• utils\n• docs');
        if (!folderName) return;
        
        const trimmedName = folderName.trim();
        if (trimmedName === '') {
            this.showError('Folder name cannot be empty');
            return;
        }
        
        // Validate folder name
        if (trimmedName.includes('/') || trimmedName.includes('\\')) {
            this.showError('Folder name cannot contain path separators');
            return;
        }
        
        if (trimmedName.includes('..')) {
            this.showError('Folder name cannot contain ".." for security reasons');
            return;
        }
        
        if (trimmedName.startsWith('.')) {
            const confirm = window.confirm(`"${trimmedName}" starts with a dot and will be hidden. Continue?`);
            if (!confirm) return;
        }
        
        try {
            // Get the target directory
            let targetDir = this.currentProject.rootPath;
            
            // If a folder is selected, create the new folder inside it
            if (this.selectedItem && this.selectedItem.classList.contains('folder-item')) {
                const folderPath = this.selectedItem.dataset.path;
                if (folderPath) {
                    targetDir = this.currentProject.rootPath + '/' + folderPath;
                }
            }
            
            const fullPath = targetDir + '/' + trimmedName;
            console.log('ProjectExplorer: Creating new folder:', fullPath);
            
            this.showLoading(true);
            this.updateStatus(`Creating folder: ${trimmedName}...`);
            
            // Create the directory using IPC
            await window.electronAPI.fileOperations.createDirectory(fullPath);
            console.log('ProjectExplorer: Folder created successfully');
            this.updateStatus(`Created folder: ${trimmedName}`);
            
            // Refresh the explorer to show the new folder
            await this.refreshExplorer();
            
            // Expand the parent folder if needed
            if (this.selectedItem && this.selectedItem.classList.contains('folder-item')) {
                const folderPath = this.selectedItem.dataset.path;
                if (folderPath) {
                    this.expandedFolders.add(folderPath);
                }
            }
            
        } catch (error) {
            console.error('ProjectExplorer: Failed to create folder:', error);
            if (error.message.includes('already exists')) {
                this.showError(`Folder "${trimmedName}" already exists. Please choose a different name.`);
            } else {
                this.showError('Failed to create folder: ' + error.message);
            }
            this.updateStatus('Folder creation failed');
        } finally {
            this.showLoading(false);
        }
    }

    async renameSelectedItem() {
        if (!this.selectedItem || !this.contextMenuTarget) {
            this.showError('Please select an item to rename');
            return;
        }
        
        const currentName = this.contextMenuTarget.path.split('/').pop();
        const newName = prompt(`Enter new name for "${currentName}":`, currentName);
        
        if (!newName || newName === currentName) return;
        
        const trimmedName = newName.trim();
        if (trimmedName === '') {
            this.showError('Name cannot be empty');
            return;
        }
        
        // Validate name
        if (trimmedName.includes('/') || trimmedName.includes('\\')) {
            this.showError('Name cannot contain path separators');
            return;
        }
        
        if (trimmedName.includes('..')) {
            this.showError('Name cannot contain ".." for security reasons');
            return;
        }
        
        try {
            // Construct old and new paths
            const pathParts = this.contextMenuTarget.path.split('/');
            pathParts[pathParts.length - 1] = trimmedName;
            const newPath = pathParts.join('/');
            
            const oldFullPath = this.currentProject.rootPath + '/' + this.contextMenuTarget.path;
            const newFullPath = this.currentProject.rootPath + '/' + newPath;
            
            console.log('ProjectExplorer: Renaming:', oldFullPath, 'to', newFullPath);
            
            this.showLoading(true);
            this.updateStatus(`Renaming ${currentName} to ${trimmedName}...`);
            
            // Rename using IPC
            await window.electronAPI.fileOperations.rename(oldFullPath, newFullPath);
            console.log('ProjectExplorer: Rename successful');
            this.updateStatus(`Renamed ${currentName} to ${trimmedName}`);
            
            // Refresh the explorer to show the renamed item
            await this.refreshExplorer();
            
        } catch (error) {
            console.error('ProjectExplorer: Failed to rename:', error);
            if (error.message.includes('already exists')) {
                this.showError(`"${trimmedName}" already exists. Please choose a different name.`);
            } else {
                this.showError('Failed to rename: ' + error.message);
            }
            this.updateStatus('Rename failed');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteSelectedItem() {
        if (!this.selectedItem || !this.contextMenuTarget) {
            this.showError('Please select an item to delete');
            return;
        }
        
        const itemName = this.contextMenuTarget.path.split('/').pop();
        const itemType = this.contextMenuTarget.type;
        
        const confirmMessage = itemType === 'folder' 
            ? `Are you sure you want to delete the folder "${itemName}" and all its contents? This action cannot be undone.`
            : `Are you sure you want to delete the file "${itemName}"? This action cannot be undone.`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const fullPath = this.currentProject.rootPath + '/' + this.contextMenuTarget.path;
            console.log('ProjectExplorer: Deleting:', fullPath);
            
            this.showLoading(true);
            this.updateStatus(`Deleting ${itemName}...`);
            
            // Delete using IPC
            if (itemType === 'folder') {
                await window.electronAPI.fileOperations.deleteDirectory(fullPath, true);
            } else {
                await window.electronAPI.fileOperations.deleteFile(fullPath);
            }
            
            console.log('ProjectExplorer: Delete successful');
            this.updateStatus(`Deleted ${itemName}`);
            
            // Clear selection
            this.selectedItem = null;
            this.contextMenuTarget = null;
            
            // Refresh the explorer to remove the deleted item
            await this.refreshExplorer();
            
        } catch (error) {
            console.error('ProjectExplorer: Failed to delete:', error);
            this.showError('Failed to delete: ' + error.message);
            this.updateStatus('Delete failed');
        } finally {
            this.showLoading(false);
        }
    }

    async refreshExplorer() {
        if (this.currentProject) {
            console.log('ProjectExplorer: Refreshing explorer...');
            this.updateStatus('Refreshing explorer...');
            
            try {
                // Reload the project
                await this.loadProject(this.currentProject.rootPath);
            } catch (error) {
                console.error('ProjectExplorer: Failed to refresh:', error);
                this.showError('Failed to refresh explorer: ' + error.message);
            }
        }
    }

    collapseAllFolders() {
        console.log('ProjectExplorer: Collapsing all folders...');
        this.expandedFolders.clear();
        this.updateFileExplorer();
        this.updateStatus('All folders collapsed');
    }

    // Search functionality
    filterFiles(searchTerm) {
        const explorer = document.getElementById('fileExplorer');
        const items = explorer.querySelectorAll('.file-item, .folder-item');
        
        if (!searchTerm.trim()) {
            // Show all items
            items.forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }
        
        const term = searchTerm.toLowerCase();
        items.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(term)) {
                item.style.display = 'flex';
                // Expand parent folders if needed
                this.expandParentFolders(item);
            } else {
                item.style.display = 'none';
            }
        });
    }

    expandParentFolders(element) {
        let parent = element.parentElement;
        while (parent && parent.classList.contains('folder-children')) {
            const folderPath = parent.dataset.folderPath;
            if (folderPath && !this.expandedFolders.has(folderPath)) {
                this.expandedFolders.add(folderPath);
                parent.classList.remove('collapsed');
                parent.classList.add('expanded');
                
                // Update folder toggle
                const folderElement = document.querySelector(`[data-path="${folderPath}"]`);
                if (folderElement) {
                    folderElement.classList.add('expanded');
                    const toggle = folderElement.querySelector('.folder-toggle');
                    const icon = folderElement.querySelector('.folder-icon');
                    if (toggle) toggle.classList.add('expanded');
                    if (icon) icon.classList.add('expanded');
                }
            }
            parent = parent.parentElement;
        }
    }

    // Utility methods
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        console.error('ProjectExplorer Error:', message);
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('statusLeft');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // Public API methods for external access
    async openFolder() {
        try {
            console.log('ProjectExplorer: Opening folder dialog...');
            
            if (!window.electronAPI || !window.electronAPI.system) {
                throw new Error('Electron API not available');
            }
            
            this.showLoading(true);
            this.updateStatus('Opening project folder...');
            
            const result = await window.electronAPI.system.showOpenDialog({
                properties: ['openDirectory'],
                title: 'Open Project Folder - Select a folder to open as project',
                buttonLabel: 'Open Project'
            });

            console.log('ProjectExplorer: Folder dialog result:', result);

            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                const selectedPath = result.filePaths[0];
                console.log('ProjectExplorer: Selected folder:', selectedPath);
                
                // Verify it's actually a directory
                try {
                    const stats = await window.electronAPI.fileOperations.stat(selectedPath);
                    if (!stats.isDirectory) {
                        this.showError('Please select a folder, not a file. Use "Open File" to open individual files.');
                        this.updateStatus('Invalid selection - file selected instead of folder');
                        return;
                    }
                } catch (statError) {
                    console.warn('ProjectExplorer: Could not verify folder stats:', statError);
                }
                
                await this.loadProject(selectedPath);
            } else {
                console.log('ProjectExplorer: Folder dialog was canceled');
                this.updateStatus('Project selection canceled');
            }
        } catch (error) {
            console.error('ProjectExplorer: Failed to open folder dialog:', error);
            this.showError('Failed to open folder dialog: ' + error.message);
            this.updateStatus('Failed to open folder dialog');
        } finally {
            this.showLoading(false);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectExplorer;
}