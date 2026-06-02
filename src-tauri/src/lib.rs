use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub extension: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub content: String,
    pub name: String,
    pub extension: Option<String>,
}

struct OpenedUrls(Mutex<Vec<String>>);

/// Read a text file from the given path
#[tauri::command]
fn read_file(path: String) -> Result<FileInfo, String> {
    let file_path = PathBuf::from(&path);
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let extension = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_string());

    Ok(FileInfo {
        path,
        content,
        name,
        extension,
    })
}

/// Write content to a file
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| e.to_string())
}

/// List directory entries
#[tauri::command]
fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(&path);
    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files/dirs
        if name.starts_with('.') {
            continue;
        }

        let path_str = entry.path().to_string_lossy().to_string();
        let extension = entry
            .path()
            .extension()
            .map(|e| e.to_string_lossy().to_string());

        entries.push(FileEntry {
            name,
            path: path_str,
            is_dir: metadata.is_dir(),
            extension,
        });
    }

    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(entries)
}

/// Get word count and other stats from content
#[tauri::command]
fn get_content_stats(content: String) -> Result<serde_json::Value, String> {
    let words: usize = content.split_whitespace().count();
    let chars: usize = content.chars().count();
    let lines: usize = content.lines().count();
    let paragraphs: usize = content
        .split("\n\n")
        .filter(|p| !p.trim().is_empty())
        .count();

    Ok(serde_json::json!({
        "words": words,
        "characters": chars,
        "lines": lines,
        "paragraphs": paragraphs,
    }))
}

/// Retrieve the list of file paths opened via OS file association
#[tauri::command]
fn get_opened_urls(state: tauri::State<OpenedUrls>) -> Vec<String> {
    let urls = state.0.lock().unwrap();
    urls.clone()
}

/// Check if a given path is a directory
#[tauri::command]
fn is_directory(path: String) -> Result<bool, String> {
    let p = PathBuf::from(&path);
    Ok(p.is_dir())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().skip(1).collect();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(OpenedUrls(Mutex::new(args)))
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_directory,
            get_content_stats,
            get_opened_urls,
            is_directory,
        ])
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png"))
                        .expect("failed to load app icon");
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
