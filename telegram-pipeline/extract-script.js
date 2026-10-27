const fs = require('fs');
const path = require('path');

function extractJobs(htmlContent) {
    const jobs = [];
    // Improved regex to find message blocks
    const messageRegex = /<div class="message default clearfix[^"]*" id="message(\d+)">([\s\S]*?)(?=<div class="message default clearfix|$)/g;
    let match;

    while ((match = messageRegex.exec(htmlContent)) !== null) {
        const messageBody = match[2];
        
        // Extract Date from the message block
        let date = "";
        const dateMatch = messageBody.match(/title="(\d{2}\.\d{2}\.\d{4}) \d{2}:\d{2}:\d{2}/);
        if (dateMatch) {
            date = dateMatch[1];
        }

        // Extract Text content - there might be multiple text blocks in some cases, but usually one
        const textMatch = messageBody.match(/<div class="text">([\s\S]*?)<\/div>/);
        if (!textMatch) continue;

        let rawText = textMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "");
        rawText = rawText.trim();

        if (rawText.length < 20) continue; // Skip very short messages

        // Basic parsing logic
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
        
        let company = "غير محدد";
        let title = "تدريب / وظيفة";
        let location = "غير مذكور";
        let salary = "غير مذكور";
        let requirements = "غير مذكور";
        let description = rawText.substring(0, 200);
        
        // Try to find specific labels
        for (const line of lines) {
            if (line.includes('الشركة') || line.includes('الجهة')) {
                company = line.split(/[:：]/)[1]?.trim() || company;
            } else if (line.includes('المسمى') || line.includes('الوظيفة') || line.includes('العنوان')) {
                title = line.split(/[:：]/)[1]?.trim() || title;
            } else if (line.includes('الموقع') || line.includes('المدينة')) {
                location = line.split(/[:：]/)[1]?.trim() || location;
            } else if (line.includes('المكافأة') || line.includes('الراتب')) {
                salary = line.split(/[:：]/)[1]?.trim() || salary;
            } else if (line.includes('الشروط') || line.includes('المتطلبات')) {
                requirements = line.split(/[:：]/)[1]?.trim() || requirements;
            }
        }

        // If company still default, try first line if it looks like a company name
        if (company === "غير محدد" && lines.length > 0) {
            if (!lines[0].includes('الفرصة') && !lines[0].includes('————')) {
                company = lines[0];
            }
        }

        // Extract Tags
        const tags = (rawText.match(/#[\w_]+/g) || []).join(' ');

        // Extract Links
        const links = [];
        const linkMatches = messageBody.match(/href="([^"]+)"/g);
        if (linkMatches) {
            linkMatches.forEach(m => {
                const url = m.match(/href="([^"]+)"/)[1];
                if (!url.includes('t.me/') && !url.includes('tg://')) {
                    links.push(url);
                }
            });
        }
        
        // Also look for emails in text
        const emailMatches = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailMatches) {
            emailMatches.forEach(email => links.push('mailto:' + email));
        }

        jobs.push({
            date,
            company,
            title,
            location,
            salary,
            requirements,
            tags,
            description,
            links: links.join(' ')
        });
    }

    return jobs;
}

const inputFile = process.argv[2];
if (!inputFile) {
    console.error("Please provide an input file.");
    process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const jobs = extractJobs(html);
fs.writeFileSync('new-jobs.json', JSON.stringify(jobs, null, 2), 'utf8');
console.log(`Extracted ${jobs.length} potential jobs.`);
