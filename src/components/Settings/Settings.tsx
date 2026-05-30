import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ThemeMode } from '../../types';
import './Settings.css';

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <span className="settings-row-label">{label}</span>
        {description && <span className="settings-row-desc">{description}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <motion.button
      className={`toggle ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="toggle-thumb"
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

export function Settings() {
  const { settings, isSettingsOpen, closeSettings, updateSetting, setTheme, resetSettings } =
    useSettingsStore();

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          <motion.div
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
          />
          <motion.div
            className="settings-panel"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="settings-header">
              <h2 className="settings-title">Settings</h2>
              <div className="settings-header-actions">
                <motion.button
                  className="settings-reset"
                  onClick={resetSettings}
                  title="Reset to defaults"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw size={16} />
                </motion.button>
                <motion.button
                  className="settings-close"
                  onClick={closeSettings}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            <div className="settings-body">
              <div className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>

                <SettingsRow label="Theme" description="Choose your preferred color scheme">
                  <select
                    className="settings-select"
                    value={settings.theme}
                    onChange={(e) => setTheme(e.target.value as ThemeMode)}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </SettingsRow>

                <SettingsRow label="Font Size" description={`${settings.fontSize}px`}>
                  <input
                    type="range"
                    className="settings-range"
                    min={10}
                    max={28}
                    step={1}
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                  />
                </SettingsRow>

                <SettingsRow label="Font Family">
                  <select
                    className="settings-select"
                    value={settings.fontFamily}
                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  >
                    <option value="'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace">JetBrains Mono</option>
                    <option value="'Fira Code', 'Cascadia Code', monospace">Fira Code</option>
                    <option value="'Cascadia Code', monospace">Cascadia Code</option>
                    <option value="'Consolas', monospace">Consolas</option>
                    <option value="'Monaco', monospace">Monaco</option>
                    <option value="monospace">System Monospace</option>
                  </select>
                </SettingsRow>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Editor</h3>

                <SettingsRow label="Line Numbers" description="Show line numbers in the gutter">
                  <Toggle
                    checked={settings.lineNumbers}
                    onChange={(v) => updateSetting('lineNumbers', v)}
                  />
                </SettingsRow>

                <SettingsRow label="Word Wrap" description="Wrap long lines at the editor width">
                  <Toggle
                    checked={settings.wordWrap}
                    onChange={(v) => updateSetting('wordWrap', v)}
                  />
                </SettingsRow>

                <SettingsRow label="Highlight Active Line">
                  <Toggle
                    checked={settings.highlightActiveLine}
                    onChange={(v) => updateSetting('highlightActiveLine', v)}
                  />
                </SettingsRow>

                <SettingsRow label="Bracket Matching">
                  <Toggle
                    checked={settings.bracketMatching}
                    onChange={(v) => updateSetting('bracketMatching', v)}
                  />
                </SettingsRow>

                <SettingsRow label="Tab Size" description={`${settings.tabSize} spaces`}>
                  <select
                    className="settings-select settings-select-sm"
                    value={settings.tabSize}
                    onChange={(e) => updateSetting('tabSize', Number(e.target.value))}
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </SettingsRow>

                <SettingsRow label="Vim Mode" description="Enable Vim keybindings">
                  <Toggle
                    checked={settings.vimMode}
                    onChange={(v) => updateSetting('vimMode', v)}
                  />
                </SettingsRow>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Auto Save</h3>

                <SettingsRow label="Auto Save" description="Automatically save files on change">
                  <Toggle
                    checked={settings.autoSave}
                    onChange={(v) => updateSetting('autoSave', v)}
                  />
                </SettingsRow>

                <SettingsRow label="Save Interval" description="Seconds between auto saves">
                  <select
                    className="settings-select settings-select-sm"
                    value={settings.autoSaveInterval}
                    onChange={(e) => updateSetting('autoSaveInterval', Number(e.target.value))}
                  >
                    <option value={5000}>5s</option>
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>1min</option>
                    <option value={300000}>5min</option>
                  </select>
                </SettingsRow>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
