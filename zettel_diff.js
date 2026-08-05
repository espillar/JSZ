const fs = require('fs');

if (process.argv.length !== 4) {
    console.error("Usage: node zettel_diff.js <original_file.json> <new_file.json>");
    process.exit(1);
}

const file1Path = process.argv[2];
const file2Path = process.argv[3];

try {
    const data1 = JSON.parse(fs.readFileSync(file1Path, 'utf8'));
    const data2 = JSON.parse(fs.readFileSync(file2Path, 'utf8'));

    const keys1 = Object.keys(data1);
    const keys2 = Object.keys(data2);

    const added = [];
    const deleted = [];
    const modified = [];

    // Check for deleted and modified zettels
    keys1.forEach(key => {
        if (!data2[key]) {
            deleted.push(key);
        } else {
            // Compare stringified objects to see if anything changed
            // This catches changes in content, name, links, backlinks, etc.
            if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
                modified.push(key);
            }
        }
    });

    // Check for newly added zettels
    keys2.forEach(key => {
        if (!data1[key]) {
            added.push(key);
        }
    });

    console.log(`--- Zettelkasten Diff ---`);
    console.log(`Original: ${file1Path}`);
    console.log(`New:      ${file2Path}\n`);

    if (deleted.length > 0) {
        console.log(`🔴 Deleted Zettels (${deleted.length}):`);
        deleted.forEach(k => console.log(`  - [${k}]`));
        console.log();
    }

    if (added.length > 0) {
        console.log(`🟢 Added Zettels (${added.length}):`);
        added.forEach(k => console.log(`  + [${k}]`));
        console.log();
    }

    if (modified.length > 0) {
        console.log(`🟡 Modified Zettels (${modified.length}):`);
        modified.forEach(k => console.log(`  ~ [${k}]`));
        console.log();
    }

    if (added.length === 0 && deleted.length === 0 && modified.length === 0) {
        console.log("✅ No differences found. Both files are identical.");
    } else {
        console.log("Summary: ", 
            `+${added.length} added, `,
            `-${deleted.length} deleted, `,
            `~${modified.length} modified`
        );
    }

} catch (error) {
    console.error("Error reading or parsing files:", error.message);
    process.exit(1);
}
