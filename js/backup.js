/**
 * js/backup.js
 * ──────────────────────────────────────────────────────
 * Backup & Restore — export all data to JSON, import
 * from a JSON backup file, and clear all data.
 * ──────────────────────────────────────────────────────
 */

let restoreData = null;   // Holds parsed backup file pending confirmation


/* 
   SUMMARY
*/

/** Update the data summary panel on the Backup page. */
function updateBackupSummary() {
  document.getElementById('backup-summary').innerHTML =
    `Cases: <b>${cases.length}</b>
     &nbsp;|&nbsp; Hearings: <b>${hearings.length}</b>
     &nbsp;|&nbsp; Settlements: <b>${settlements.length}</b>
     &nbsp;|&nbsp; Members: <b>${members.length}</b>`;
}


/* 
   EXPORT
 */

/** Export all data to a timestamped .json backup file. */
function exportBackup() {
  const data = {
    version:    2,
    exportedAt: new Date().toISOString(),
    brgy:       cfg.brgy,
    cases,
    hearings,
    settlements,
    members
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];

  a.href     = url;
  a.download = `Lupon-Backup-${cfg.brgy.replace(/\s+/g, '-')}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);

  toast('💾 Backup exported!');
}


/* 
   IMPORT / RESTORE
 */

/**
 * Read a selected .json file and show a preview before restoring.
 * @param {Event} event - File input change event
 */
function previewRestore(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Validate minimum structure
      if (!data.cases || !data.hearings) {
        toast('⚠️ Invalid backup file.', '#b22222');
        return;
      }

      restoreData = data;

      // Show preview panel
      document.getElementById('restore-fname').textContent = file.name;
      document.getElementById('restore-details').innerHTML =
        `Cases: <b>${data.cases.length}</b>
         &nbsp;|&nbsp; Hearings: <b>${data.hearings.length}</b>
         &nbsp;|&nbsp; Settlements: <b>${(data.settlements || []).length}</b>
         &nbsp;|&nbsp; Members: <b>${(data.members || []).length}</b><br>
         Exported:
         <b>${data.exportedAt
               ? new Date(data.exportedAt).toLocaleString('en-PH')
               : 'Unknown date'}</b>
         from <b>${data.brgy || 'Unknown barangay'}</b>`;

      document.getElementById('restore-preview').style.display = 'block';
      document.getElementById('restore-btn').style.display     = 'block';

    } catch (err) {
      toast('⚠️ Could not read file. Ensure it is a valid .json backup.', '#b22222');
    }
  };

  reader.readAsText(file);
}


function confirmRestore() {
  if (!restoreData) return;

  if (!confirm(
    'How do you want to restore?\n\n' +
    'OK = MERGE (adds new records, keeps existing ones)\n' +
    'Cancel = do nothing'
  )) return;

  // Merge — only add records whose id doesn't already exist
  const mergeArray = (existing, incoming) => {
    const existingIds = new Set(existing.map(x => x.id));
    const newItems = incoming.filter(x => !existingIds.has(x.id));
    return [...existing, ...newItems];
  };

  cases       = mergeArray(cases,       restoreData.cases       || []);
  hearings    = mergeArray(hearings,     restoreData.hearings    || []);
  settlements = mergeArray(settlements,  restoreData.settlements || []);
  members     = mergeArray(members,      restoreData.members     || []);

  persist();

  restoreData = null;
  document.getElementById('restore-preview').style.display = 'none';
  document.getElementById('restore-btn').style.display     = 'none';
  document.getElementById('restore-file').value            = '';

  updateBackupSummary();
  toast('Data merged successfully!');
}


/* 
   CLEAR ALL DATA
 */

/** Permanently delete all stored data after double confirmation. */
function clearAllData() {
  if (!confirm(
    'DELETE ALL DATA?\n\n' +
    'This will permanently erase all cases, hearings, settlements, and members.\n' +
    'This CANNOT be undone. Are you absolutely sure?'
  )) return;

  if (!confirm('Final confirmation: permanently delete everything?')) return;

  cases       = [];
  hearings    = [];
  settlements = [];
  members     = [];

  persist();
  updateBackupSummary();
  renderDashboard();
  toast('All data cleared.', '#b22222');
}
