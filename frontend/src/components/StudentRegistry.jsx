import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import { generateId } from '../utils/ui-utils';

const parseSemNumber = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    if (!isNaN(n) && n > 0) return n;
    const s = String(val).trim().toUpperCase();
    if (s.includes("8") || /\bVIII\b/.test(s) || s === "VIII" || s.endsWith("VIII") || s === "8") return 8;
    if (s.includes("7") || /\bVII\b/.test(s) || s === "VII" || s.endsWith("VII") || s === "7") return 7;
    if (s.includes("6") || /\bVI\b/.test(s) || s === "VI" || s.endsWith("VI") || s === "6") return 6;
    if (s.includes("4") || /\bIV\b/.test(s) || s === "IV" || s.endsWith("IV") || s === "4") return 4;
    if (s.includes("5") || /\bV\b/.test(s) || s === "V" || s.endsWith("V") || s === "5") return 5;
    if (s.includes("3") || /\bIII\b/.test(s) || s === "III" || s.endsWith("III") || s === "3") return 3;
    if (s.includes("2") || /\bII\b/.test(s) || s === "II" || s.endsWith("II") || s === "2") return 2;
    if (s.includes("1") || /\bI\b/.test(s) || s === "I" || s.endsWith("I") || s === "1") return 1;
    const parsed = parseInt(s.replace(/\D/g, ''), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
};

const isSameStudent = (s1, s2) => {
    if (!s1 || !s2) return false;
    if (s1.id && s2.id && s1.id === s2.id) return true;
    const k1 = (s1.roll || s1.rollNo || s1.misNo || s1.mis || '').toString().trim().toLowerCase();
    const k2 = (s2.roll || s2.rollNo || s2.misNo || s2.mis || '').toString().trim().toLowerCase();
    return Boolean(k1 && k2 && k1 === k2);
};

const promoteStudentObj = (s, targetSemNum) => {
    const semNum = parseSemNumber(s.semester);
    if (semNum !== targetSemNum) return s;

    const newSemNum = targetSemNum + 1;
    const newSem = String(newSemNum);

    let newYear = s.acadYear || s.academicYear;
    if (targetSemNum % 2 === 0 && newYear) {
        const parts = String(newYear).split('-');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            newYear = `${parseInt(parts[0], 10) + 1}-${parseInt(parts[1], 10) + 1}`;
        }
    }

    return {
        ...s,
        semester: newSem,
        acadYear: newYear || s.acadYear,
        academicYear: newYear || s.academicYear
    };
};

const demoteStudentObj = (s) => {
    const currentSemNum = parseSemNumber(s.semester);
    if (!currentSemNum || currentSemNum <= 1) return s;
    const newSemNum = currentSemNum - 1;
    const newSem = String(newSemNum);

    let newYear = s.acadYear || s.academicYear;
    if (currentSemNum % 2 !== 0 && newYear) {
        const parts = String(newYear).split('-');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            newYear = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
        }
    }
    return {
        ...s,
        semester: newSem,
        acadYear: newYear || s.acadYear,
        academicYear: newYear || s.academicYear
    };
};

export default function StudentRegistry({ st, dispatch }) {
    const fileInputRef = useRef(null);
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const courseStudents = st?.students || [];

    const setCourseStudents = (newStudents) => {
        dispatch({ type: 'SET_STUDENTS', payload: newStudents });
    };

    const handleStudentFieldChange = (studentId, field, value) => {
        const updated = courseStudents.map(s => {
            if (s.id !== studentId) return s;
            const updatedStudent = { ...s, [field]: value };
            if (field === 'misNo') {
                updatedStudent.mis = value;
                updatedStudent.rollNo = value;
                updatedStudent.roll = value;
            } else if (field === 'mobile') {
                updatedStudent.phone = value;
                updatedStudent.mobileNo = value;
            } else if (field === 'academicYear') {
                updatedStudent.acadYear = value;
            } else if (field === 'admission') {
                updatedStudent.admissionYear = value;
                updatedStudent.batchYear = value;
            }
            return updatedStudent;
        });
        setCourseStudents(updated);
    };

    const [masterStudents, setMasterStudents] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('app_token') || localStorage.getItem('token');
        if (!token) return;
        fetch(`http://${window.location.hostname}:3001/api/v2/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.students) {
                    setMasterStudents(prev => {
                        const dbMerged = [...data.students];
                        prev.forEach(s => {
                            const key = String(s.roll || s.id || '').trim().toLowerCase();
                            if (!dbMerged.some(d => String(d.roll || d.id || '').trim().toLowerCase() === key)) {
                                dbMerged.push(s);
                            }
                        });
                        return dbMerged;
                    });
                }
            })
            .catch(err => console.error("Error fetching master roster:", err));
    }, []);

    // Form states
    const [courseBulkText, setCourseBulkText] = useState("2023ME001, Aarav Sharma\n2023ME002, Diya Patel");
    const [masterBulkText, setMasterBulkText] = useState("2023ME001, Aarav Sharma\n2023ME002, Diya Patel");
    const [masterBulkSem, setMasterBulkSem] = useState("1");
    const [masterBulkYear, setMasterBulkYear] = useState("2026-27");
    const [promoteSem, setPromoteSem] = useState("1");
    const [selectedFilterSem, setSelectedFilterSem] = useState("ALL");

    // Modal states for adding one student
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMisNo, setNewMisNo] = useState("");
    const [newName, setNewName] = useState("");
    const [newMobile, setNewMobile] = useState("");
    const [newEmail, setNewEmail] = useState("");

    // Default values for new course students
    const defaultSemester = "1";
    const defaultAcadYear = "2026-27";


    const validateStudent = (roll, name, email, mobile) => {
        if (!roll || !name) return "MIS No. / Roll Number and Name are required.";

        const rollHasNumber = /[0-9]/.test(roll);
        const nameHasNumber = /[0-9]/.test(name);

        if (!rollHasNumber && nameHasNumber) {
            return "It looks like MIS No. and Student Name are entered in the wrong fields. Please correct them before saving.";
        }

        if (!/^[A-Za-z0-9-]+$/.test(roll) || !rollHasNumber) {
            return `Invalid MIS No.: "${roll}". Must contain numbers and no spaces.`;
        }

        if (nameHasNumber) {
            return `Invalid Name: "${name}". Name should not contain numbers.`;
        }

        if (email && email !== "—" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return `Invalid Email Address: "${email}". Please enter a valid email format.`;
        }

        if (mobile && mobile !== "—" && (!/^[0-9+() -]{7,15}$/.test(mobile) || !/[0-9]{5,}/.test(mobile))) {
            return `Invalid Phone Number: "${mobile}". Please enter a valid contact number.`;
        }

        return null;
    };

    const handleAddOneCourseStudent = () => {
        setNewMisNo("");
        setNewName("");
        setNewMobile("");
        setNewEmail("");
        setShowAddModal(true);
    };

    const handleConfirmAddOne = () => {
        const mis = newMisNo.trim();
        const name = newName.trim();
        const mobile = newMobile.trim();
        const email = newEmail.trim();

        const error = validateStudent(mis, name, email, mobile);
        if (error) {
            addToast(error, "error");
            return;
        }

        if (courseStudents.some(s => s.misNo === mis || s.mis === mis || s.roll === mis || s.rollNo === mis || s.id === mis)) {
            addToast("A student with this MIS No. already exists in this course.", "warning");
            return;
        }

        const newStudent = {
            id: generateId(),
            roll: mis,
            rollNo: mis,
            misNo: mis,
            mis: mis,
            name: name,
            mobile: mobile || "—",
            phone: mobile || "—",
            email: email || "—",
            semester: defaultSemester,
            acadYear: defaultAcadYear,
            academicYear: defaultAcadYear,
            admission: "2023-24"
        };

        setCourseStudents([...courseStudents, newStudent]);
        setShowAddModal(false);
        addToast("Student added successfully.", "success");
    };

    const handleImportFromMaster = () => {
        if (!masterStudents || masterStudents.length === 0) {
            addToast("No students in Master Roster.", "warning");
            return;
        }

        // Avoid duplicates by checking roll numbers
        const newStudents = masterStudents.filter(
            ms => !courseStudents.some(cs => cs.roll === ms.roll || cs.id === ms.id || cs.rollNo === ms.roll)
        ).map(s => ({
            ...s,
            id: s.roll || generateId(),
            rollNo: s.roll || s.id,
            semester: st?.selectedSemester || st?.coursePlan?.semester || "V",
            academicYear: st?.academicYear || st?.coursePlan?.academicYear || "2026-27"
        }));

        if (newStudents.length === 0) {
            addToast("All Master Roster students are already assigned to this subject.", "info");
            return;
        }

        setCourseStudents([...courseStudents, ...newStudents]);
        addToast(`Imported ${newStudents.length} students into this subject's roster.`, "success");
    };

    const handleCourseBulkAdd = () => {
        if (!courseBulkText.trim()) return;
        const lines = courseBulkText.split('\n');
        const newStudents = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 2) {
                addToast(`Line ${i + 1}: Missing comma separated value.\n"${line}"`, "error");
                return;
            }

            const roll = parts[0].trim();
            const name = parts[1].trim();

            const error = validateStudent(roll, name);
            if (error) {
                addToast(`Line ${i + 1} failed validation:\n${error}`, "error");
                return;
            }

            newStudents.push({ id: generateId(), roll, name, semester: defaultSemester, acadYear: defaultAcadYear });
        }

        setCourseStudents([...courseStudents, ...newStudents]);
        setCourseBulkText('');
    };

    const handleExcelImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
                    .filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));

                if (rawRows.length === 0) {
                    addToast("The uploaded Excel file is empty or formatted incorrectly.", "error");
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                const firstRowText = rawRows[0].map(String).join(' ').toLowerCase();
                const isHeader = ['mis', 'roll', 'name', 'email', 'mobile', 'phone', 'sem', 'admission', 'year', 'student', 'id', 'no.', 'contact'].some(h => firstRowText.includes(h));

                let colMap = { mis: -1, name: -1, mobile: -1, email: -1, sem: -1, admission: -1, acadYear: -1 };
                if (isHeader) {
                    rawRows[0].forEach((headerCell, idx) => {
                        const h = String(headerCell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (colMap.mis === -1 && (h.includes('mis') || h.includes('roll') || h === 'id' || h.includes('reg') || h.includes('enroll'))) colMap.mis = idx;
                        else if (colMap.name === -1 && (h.includes('name') || h === 'student' || h.includes('studentname'))) colMap.name = idx;
                        else if (colMap.mobile === -1 && (h.includes('mobile') || h.includes('phone') || h.includes('contact') || h.includes('whatsapp'))) colMap.mobile = idx;
                        else if (colMap.email === -1 && (h.includes('email') || h.includes('mail'))) colMap.email = idx;
                        else if (colMap.sem === -1 && (h === 'sem' || h.includes('semester') || h === 'term')) colMap.sem = idx;
                        else if (colMap.admission === -1 && (h.includes('admission') || h.includes('batch') || h.includes('join'))) colMap.admission = idx;
                        else if (colMap.acadYear === -1 && (h.includes('acad') || h.includes('session') || h.includes('academicyear'))) colMap.acadYear = idx;
                    });
                } else {
                    colMap = { mis: 0, name: 1, mobile: 2, email: 3, sem: 4, admission: 5, acadYear: 6 };
                }
                if (colMap.mis === -1 && colMap.name !== 0) colMap.mis = 0;
                if (colMap.name === -1 && colMap.mis !== 1) colMap.name = 1;

                const newStudents = [];
                for (let i = (isHeader ? 1 : 0); i < rawRows.length; i++) {
                    const row = rawRows[i];
                    if (!row || row.length === 0) continue;

                    const misVal = colMap.mis !== -1 && row[colMap.mis] !== undefined ? String(row[colMap.mis]).trim() : '';
                    const nameVal = colMap.name !== -1 && row[colMap.name] !== undefined ? String(row[colMap.name]).trim() : '';
                    const mobileVal = colMap.mobile !== -1 && row[colMap.mobile] !== undefined ? String(row[colMap.mobile]).trim() : '';
                    const emailVal = colMap.email !== -1 && row[colMap.email] !== undefined ? String(row[colMap.email]).trim() : '';
                    const semVal = colMap.sem !== -1 && row[colMap.sem] !== undefined ? String(row[colMap.sem]).trim() : '';
                    const admVal = colMap.admission !== -1 && row[colMap.admission] !== undefined ? String(row[colMap.admission]).trim() : '';
                    const acadVal = colMap.acadYear !== -1 && row[colMap.acadYear] !== undefined ? String(row[colMap.acadYear]).trim() : '';

                    if (!misVal && !nameVal) continue;

                    const finalMis = misVal || `MIS-${Date.now()}-${i}`;
                    const finalName = nameVal || 'Unnamed Student';

                    newStudents.push({
                        id: generateId(),
                        misNo: finalMis,
                        mis: finalMis,
                        rollNo: finalMis,
                        roll: finalMis,
                        name: finalName,
                        mobile: mobileVal || undefined,
                        phone: mobileVal || undefined,
                        email: emailVal || undefined,
                        semester: semVal || defaultSemester || '1',
                        admission: admVal || '2023-24',
                        batchYear: admVal || '2023-24',
                        academicYear: acadVal || defaultAcadYear || '2026-27',
                        acadYear: acadVal || defaultAcadYear || '2026-27'
                    });
                }

                if (newStudents.length > 0) {
                    setCourseStudents([...courseStudents, ...newStudents]);
                    addToast(`Successfully imported ${newStudents.length} student${newStudents.length > 1 ? 's' : ''} from Excel file!`, "success");
                } else {
                    addToast("No valid student records found in the Excel file.", "error");
                }
            } catch (err) {
                console.error("Error reading Excel file:", err);
                addToast("Error parsing Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.", "error");
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            ["MIS No.", "Name", "Mobile Number", "Email ID", "Semester", "Admission", "Academic Year"],
            ["2023ME001", "Aarav Sharma", "9876543210", "aarav@spit.ac.in", "1", "2023-24", "2026-27"],
            ["2023ME002", "Priya Verma", "9876543211", "priya@spit.ac.in", "1", "2023-24", "2026-27"]
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Student Roster");
        XLSX.writeFile(workbook, "student_import_template.xlsx");
        addToast("Downloaded Excel import template!", "success");
    };

    const handleMasterBulkAdd = () => {
        if (!masterBulkText.trim()) return;
        const lines = masterBulkText.split('\n');
        const newStudents = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 2) {
                addToast(`Line ${i + 1}: Missing comma separated value.\n"${line}"`, "error");
                return;
            }

            const roll = parts[0].trim();
            const name = parts[1].trim();

            const error = validateStudent(roll, name);
            if (error) {
                addToast(`Line ${i + 1} failed validation:\n${error}`, "error");
                return;
            }

            newStudents.push({ id: generateId(), roll, name, semester: masterBulkSem, acadYear: masterBulkYear });
        }

        const updatedMaster = [...masterStudents, ...newStudents];
        setMasterStudents(updatedMaster);
        setMasterBulkText('');

        const token = localStorage.getItem('app_token') || localStorage.getItem('token');
        fetch(`http://${window.location.hostname}:3001/api/v2/students/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ students: updatedMaster })
        }).catch(err => console.error("Error saving master roster:", err));
    };

    // Compute synchronized distinct students map for accurate semester exists & count calculation
    const studentMap = new Map();
    courseStudents.forEach(s => {
        const key = (s.rollNo || s.roll || s.misNo || s.mis || s.id || '').toString().trim().toLowerCase();
        if (key) studentMap.set(key, s);
    });
    masterStudents.forEach(s => {
        const key = (s.rollNo || s.roll || s.misNo || s.mis || s.id || '').toString().trim().toLowerCase();
        if (key && !studentMap.has(key)) studentMap.set(key, s);
    });

    const studentsBySemCount = {};
    Array.from(studentMap.values()).forEach(s => {
        const semNum = parseSemNumber(s.semester || '1');
        if (semNum) {
            studentsBySemCount[semNum] = (studentsBySemCount[semNum] || 0) + 1;
        }
    });

    const existingSemesters = Object.keys(studentsBySemCount)
        .map(Number)
        .sort((a, b) => a - b);

    // If active filtered semester no longer exists after promotion/demotion, fall back to 'ALL'
    const effectiveFilterSem = (selectedFilterSem !== 'ALL' && !existingSemesters.includes(Number(selectedFilterSem)))
        ? 'ALL'
        : selectedFilterSem;

    useEffect(() => {
        if (selectedFilterSem !== 'ALL' && existingSemesters.length > 0 && !existingSemesters.includes(Number(selectedFilterSem))) {
            setSelectedFilterSem('ALL');
        }
    }, [existingSemesters, selectedFilterSem]);

    // If active promoteSem doesn't exist in existingSemesters, fall back to the first existing semester
    const activePromoteSem = existingSemesters.includes(Number(promoteSem))
        ? String(promoteSem)
        : (existingSemesters[0] !== undefined ? String(existingSemesters[0]) : "1");

    const filteredCourseStudents = courseStudents.filter(s => {
        if (effectiveFilterSem !== 'ALL') {
            const semNum = parseSemNumber(s.semester);
            if (semNum !== Number(effectiveFilterSem)) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const roll = (s.roll || s.rollNo || s.misNo || s.mis || s.id || '').toString().toLowerCase();
            const name = (s.name || '').toString().toLowerCase();
            if (!roll.includes(q) && !name.includes(q)) return false;
        }
        return true;
    });

    const filteredMasterStudents = masterStudents.filter(s => {
        if (effectiveFilterSem !== 'ALL') {
            const semNum = parseSemNumber(s.semester);
            if (semNum !== Number(effectiveFilterSem)) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const roll = (s.roll || s.rollNo || s.misNo || s.mis || s.id || '').toString().toLowerCase();
            const name = (s.name || '').toString().toLowerCase();
            if (!roll.includes(q) && !name.includes(q)) return false;
        }
        return true;
    });

    const handlePromote = () => {
        const semToPromote = parseSemNumber(activePromoteSem);
        if (!semToPromote) {
            addToast("No valid semester selected to promote.", "warning");
            return;
        }
        let promotedMasterCount = 0;
        const updatedMaster = masterStudents.map(s => {
            if (parseSemNumber(s.semester) === semToPromote) {
                promotedMasterCount++;
                return promoteStudentObj(s, semToPromote);
            }
            return s;
        });

        let promotedCourseCount = 0;
        const updatedCourse = courseStudents.map(s => {
            if (parseSemNumber(s.semester) === semToPromote) {
                promotedCourseCount++;
                return promoteStudentObj(s, semToPromote);
            }
            return s;
        });

        const totalPromoted = Math.max(promotedMasterCount, promotedCourseCount);

        if (totalPromoted > 0) {
            if (promotedMasterCount > 0) {
                setMasterStudents(updatedMaster);
                const token = localStorage.getItem('app_token') || localStorage.getItem('token');
                if (token) {
                    fetch(`http://${window.location.hostname}:3001/api/v2/students/bulk`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ students: updatedMaster })
                    }).catch(err => console.error("Error saving master roster:", err));
                }
            }
            if (promotedCourseCount > 0) {
                setCourseStudents(updatedCourse);
            }
            addToast(`Promoted ${totalPromoted} student${totalPromoted > 1 ? 's' : ''} from Semester ${semToPromote} to ${semToPromote + 1}.`, "success");
        } else {
            addToast(`No students found in Semester ${semToPromote} to promote.`, "warning");
        }
    };

    const handleRemoveCourseStudent = (id) => {
        const target = courseStudents.find(s => s.id === id);
        if (!target) return;

        const currentSemNum = parseSemNumber(target.semester);
        if (currentSemNum && currentSemNum > 1) {
            const newSemNum = currentSemNum - 1;

            const updatedCourse = courseStudents.map(s => {
                if (s.id === id || isSameStudent(s, target)) {
                    return demoteStudentObj(s);
                }
                return s;
            });
            setCourseStudents(updatedCourse);

            // Synchronize demotion with Master Roster
            let changedMaster = false;
            const updatedMaster = masterStudents.map(s => {
                if (isSameStudent(s, target)) {
                    changedMaster = true;
                    return demoteStudentObj(s);
                }
                return s;
            });
            if (changedMaster) {
                setMasterStudents(updatedMaster);
                const token = localStorage.getItem('app_token') || localStorage.getItem('token');
                if (token) {
                    fetch(`http://${window.location.hostname}:3001/api/v2/students/bulk`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ students: updatedMaster })
                    }).catch(err => console.error("Error saving master roster:", err));
                }
            }

            addToast(`Removed ${target.name || target.roll || 'Student'} from Semester ${currentSemNum} and moved back to Semester ${newSemNum}.`, "info");
        } else {
            setCourseStudents(courseStudents.filter(s => s.id !== id && !isSameStudent(s, target)));
            addToast(`Removed ${target.name || target.roll || 'Student'} from This course's roster.`, "info");
        }
    };

    const handleRemoveMasterStudent = (id) => {
        const target = masterStudents.find(s => s.id === id);
        if (!target) return;

        const currentSemNum = parseSemNumber(target.semester);
        if (currentSemNum && currentSemNum > 1) {
            const newSemNum = currentSemNum - 1;

            const updatedMaster = masterStudents.map(s => {
                if (s.id === id || isSameStudent(s, target)) {
                    return demoteStudentObj(s);
                }
                return s;
            });
            setMasterStudents(updatedMaster);
            const token = localStorage.getItem('app_token') || localStorage.getItem('token');
            if (token) {
                fetch(`http://${window.location.hostname}:3001/api/v2/students/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ students: updatedMaster })
                }).catch(err => console.error("Error saving master roster:", err));
            }

            // Synchronize demotion with Course Roster
            let changedCourse = false;
            const updatedCourse = courseStudents.map(s => {
                if (isSameStudent(s, target)) {
                    changedCourse = true;
                    return demoteStudentObj(s);
                }
                return s;
            });
            if (changedCourse) {
                setCourseStudents(updatedCourse);
            }

            addToast(`Removed ${target.name || target.roll || 'Student'} from Semester ${currentSemNum} and moved back to Semester ${newSemNum}.`, "info");
        } else {
            const updatedMaster = masterStudents.filter(s => s.id !== id && !isSameStudent(s, target));
            setMasterStudents(updatedMaster);
            const token = localStorage.getItem('app_token') || localStorage.getItem('token');
            if (token) {
                fetch(`http://${window.location.hostname}:3001/api/v2/students/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ students: updatedMaster })
                }).catch(err => console.error("Error saving master roster:", err));
            }
            // Synchronize removal with Course Roster if student is deleted at Semester 1
            const updatedCourse = courseStudents.filter(s => !isSameStudent(s, target));
            if (updatedCourse.length !== courseStudents.length) {
                setCourseStudents(updatedCourse);
            }

            addToast(`Removed ${target.name || target.roll || 'Student'} from Master Roster.`, "info");
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Student Roster</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                This course's roster (used for marks & attendance) plus a shared Master Roster that carries the same batch of students across semesters — type them in once at Semester 1, then Promote each term instead of retyping.
            </div>

            {/* Global Search Bar */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search MIS No. or Name..."
                    style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                />
            </div>

            {/* This course's roster */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>This course's roster ({courseStudents.length})</h2>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '16px' }}>
                    MIS No./Name feed marks & attendance here. Mobile Number, Email ID, Semester, Admission, and Academic Year provide complete per-student records.
                </div>

                <div style={{ overflowX: 'auto', width: '100%', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', overflow: 'hidden' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', width: '36px', borderBottom: '1px solid #e2e8f0' }}>#</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '130px', borderBottom: '1px solid #e2e8f0' }}>MIS NO.</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', minWidth: '150px', borderBottom: '1px solid #e2e8f0' }}>NAME</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '130px', borderBottom: '1px solid #e2e8f0' }}>MOBILE NUMBER</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', minWidth: '180px', borderBottom: '1px solid #e2e8f0' }}>EMAIL ID</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '90px', borderBottom: '1px solid #e2e8f0' }}>SEMESTER</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '100px', borderBottom: '1px solid #e2e8f0' }}>ADMISSION</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '110px', borderBottom: '1px solid #e2e8f0' }}>ACADEMIC YEAR</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', width: '40px', borderBottom: '1px solid #e2e8f0' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                        No students yet — add some below, or import from the Master Roster.
                                    </td>
                                </tr>
                            ) : filteredCourseStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                        No students found in Semester {effectiveFilterSem}.
                                    </td>
                                </tr>
                            ) : (
                                filteredCourseStudents.map((s, index) => {
                                    const misValue = s.misNo !== undefined ? s.misNo : (s.mis !== undefined ? s.mis : (s.rollNo !== undefined ? s.rollNo : (s.roll !== undefined ? s.roll : s.id || '')));
                                    const nameValue = s.name !== undefined ? s.name : '';
                                    const mobileValue = s.mobile !== undefined ? s.mobile : (s.mobileNo !== undefined ? s.mobileNo : (s.phone !== undefined ? s.phone : (s.roll || s.id ? `9823${String(100000 + (parseInt(String(s.roll || s.id).replace(/\D/g, '').slice(-3), 10) || index) * 127).slice(0, 6)}` : '')));
                                    const emailValue = s.email !== undefined ? s.email : (s.name ? `${s.name.toLowerCase().replace(/[' ]/g, '.')}@spit.ac.in` : '');
                                    const semValue = s.semester !== undefined ? s.semester : '';
                                    const admissionValue = s.admission !== undefined ? s.admission : (s.admissionYear !== undefined ? s.admissionYear : (s.batchYear !== undefined ? s.batchYear : '2023-24'));
                                    const acadYearValue = s.academicYear !== undefined ? s.academicYear : (s.acadYear !== undefined ? s.acadYear : '2026-27');

                                    const inputStyle = {
                                        width: '100%',
                                        padding: '6px 8px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        color: '#1e293b',
                                        background: '#fff',
                                        outline: 'none',
                                        transition: 'all 0.15s'
                                    };

                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>{index + 1}</td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={misValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'misNo', e.target.value)}
                                                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="MIS No."
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={nameValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'name', e.target.value)}
                                                    style={inputStyle}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Student Name"
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={mobileValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'mobile', e.target.value)}
                                                    style={inputStyle}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Mobile No."
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={emailValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'email', e.target.value)}
                                                    style={{ ...inputStyle, color: '#3b82f6' }}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Email Address"
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={semValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'semester', e.target.value)}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Sem"
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={admissionValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'admission', e.target.value)}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Year"
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <input
                                                    type="text"
                                                    value={acadYearValue}
                                                    onChange={(e) => handleStudentFieldChange(s.id, 'academicYear', e.target.value)}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.border = '1px solid #cbd5e1'; e.target.style.boxShadow = 'none'; }}
                                                    placeholder="Acad Year"
                                                />
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                <button onClick={() => handleRemoveCourseStudent(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>×</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleAddOneCourseStudent} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>+ Add one student</button>
                    <button onClick={handleImportFromMaster} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>&#8650; Import Semester I from Master Roster</button>
                </div>
            </div>

            {/* Bulk add to this course */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '16px' }}>Bulk add to this course</h2>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ONE STUDENT PER LINE: ROLL,NAME</label>
                    <textarea
                        value={courseBulkText}
                        onChange={(e) => setCourseBulkText(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', minHeight: '80px', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}
                        placeholder="e.g. 2023ME001, Aarav Sharma"
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <button onClick={handleCourseBulkAdd} style={{ background: '#328470', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Add students from text
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>or</span>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>📁 Import Excel / CSV File</span>
                    </button>
                    <button
                        onClick={handleDownloadTemplate}
                        style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Download sample Excel template with columns for MIS No, Name, Mobile, Email, Semester, Admission, and Academic Year"
                    >
                        <span>📥 Download Template</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleExcelImport}
                        accept=".xlsx, .xls, .csv, .tsv"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.6', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '4px', fontWeight: '600', color: '#334155' }}>💡 Import Options:</div>
                    <div>• <strong>Text input:</strong> Paste simple comma-separated Roll, Name per line.</div>
                    <div>• <strong>Excel Import:</strong> Upload any <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file containing columns for MIS No., Name, Mobile Number, Email ID, Semester, Admission, and Academic Year.</div>
                </div>
            </div>

            {/* Master Roster */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>Master Roster ({masterStudents.length}) — shared across all courses</h2>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '24px' }}>
                    The authoritative, department-wide student list. Add a batch once at Semester 1; from then on, use <strong>Promote</strong> below to move everyone forward instead of retyping rosters for every new course.
                </div>

                {/* Bulk add to master roster */}
                <h3 style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>BULK ADD TO MASTER ROSTER</h3>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>SEMESTER</label>
                        <select value={masterBulkSem} onChange={(e) => setMasterBulkSem(e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ACADEMIC YEAR</label>
                        <input type="text" value={masterBulkYear} onChange={(e) => setMasterBulkYear(e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ONE STUDENT PER LINE: ROLL,NAME</label>
                    <textarea
                        value={masterBulkText}
                        onChange={(e) => setMasterBulkText(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', minHeight: '80px', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}
                        placeholder="e.g. 2023ME001, Aarav Sharma"
                    />
                </div>

                <button onClick={handleMasterBulkAdd} style={{ background: '#328470', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '32px' }}>Add to Master Roster</button>

                {/* Promote and Clickable Semester Filter List */}
                <h3 style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>PROMOTE A SEMESTER FORWARD</h3>

                {/* Clickable Semester Filter List */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div
                        onClick={() => setSelectedFilterSem('ALL')}
                        style={{
                            padding: '7px 14px',
                            borderRadius: '6px',
                            background: effectiveFilterSem === 'ALL' ? '#1e293b' : '#f8fafc',
                            border: effectiveFilterSem === 'ALL' ? '1px solid #0f172a' : '1px solid #cbd5e1',
                            color: effectiveFilterSem === 'ALL' ? '#fff' : '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: effectiveFilterSem === 'ALL' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                        }}
                        title="Click to remove filter and display students from all semesters"
                    >
                        All Students
                    </div>

                    {existingSemesters.map(sem => {
                        const count = studentsBySemCount[sem] || 0;
                        const isSelected = effectiveFilterSem !== 'ALL' && Number(effectiveFilterSem) === sem;
                        return (
                            <div
                                key={sem}
                                onClick={() => setSelectedFilterSem(String(sem))}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '6px',
                                    background: isSelected ? '#eff6ff' : '#f8fafc',
                                    border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                                    color: isSelected ? '#1e3a8a' : '#334155',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: isSelected ? '0 1px 3px rgba(59, 130, 246, 0.15)' : 'none'
                                }}
                                title={`Click to filter roster by Semester ${sem}`}
                            >
                                <strong style={{ color: isSelected ? '#2563eb' : '#334155', fontWeight: '600' }}>Semester {sem}</strong>
                                <span style={{ color: '#94a3b8' }}>–</span>
                                <span style={{ fontWeight: '600', color: isSelected ? '#1d4ed8' : '#475569' }}>{count} {count === 1 ? 'Student' : 'Students'}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Promote Controls (Independent of Filter) */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <select
                        value={activePromoteSem}
                        onChange={(e) => setPromoteSem(e.target.value)}
                        disabled={existingSemesters.length === 0}
                        style={{ width: '260px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}
                    >
                        {existingSemesters.length === 0 ? (
                            <option value="">No existing semesters to promote</option>
                        ) : (
                            existingSemesters.map(sem => (
                                <option key={sem} value={sem}>
                                    Semester {sem} ({studentsBySemCount[sem] || 0} students) &rarr; Semester {sem + 1}
                                </option>
                            ))
                        )}
                    </select>
                    <button
                        onClick={handlePromote}
                        disabled={existingSemesters.length === 0}
                        style={{
                            background: existingSemesters.length === 0 ? '#94a3b8' : '#328470',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: existingSemesters.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Promote &#8594;
                    </button>
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '32px', lineHeight: '1.5' }}>
                    Academic Year advances automatically when crossing into a new year (Sem 2→3, 4→5, 6→7); it stays the same within a year (Sem 1→2, 3→4, 5→6, 7→8). <em>Note: Clicking semester badges above filters the tables independently without changing your promotion selection.</em>
                </div>

                {/* All students */}
                <h3 style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>ALL STUDENTS, BY SEMESTER</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '200px', borderBottom: '1px solid #e2e8f0' }}>ROLL NO.</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>NAME</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '100px', borderBottom: '1px solid #e2e8f0' }}>SEMESTER</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '100px', borderBottom: '1px solid #e2e8f0' }}>ACAD. YEAR</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', width: '40px', borderBottom: '1px solid #e2e8f0' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {masterStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                    Master Roster is empty — add students above.
                                </td>
                            </tr>
                        ) : filteredMasterStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                    No students in Master Roster for Semester {effectiveFilterSem}.
                                </td>
                            </tr>
                        ) : (
                            filteredMasterStudents.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>{s.roll}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>{s.name}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>{s.semester}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>{s.acadYear}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                        <button
                                            onClick={() => handleRemoveMasterStudent(s.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                                            title={parseInt(String(s.semester), 10) > 1 ? `Remove from Semester ${s.semester} (move back to Semester ${parseInt(String(s.semester), 10) - 1})` : "Remove from Master Roster"}
                                        >×</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        background: '#fff', padding: '28px', borderRadius: '12px', width: '440px', maxWidth: '92%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Add One Student</span>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '22px', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', lineHeight: '1' }}>×</button>
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MIS No. *</label>
                            <input
                                type="text"
                                placeholder="e.g. 2023ME001"
                                value={newMisNo}
                                onChange={(e) => setNewMisNo(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Aarav Sharma"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 9823100011"
                                value={newMobile}
                                onChange={(e) => setNewMobile(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email ID</label>
                            <input
                                type="email"
                                placeholder="e.g. aarav.sharma@spit.ac.in"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ padding: '9px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAddOne}
                                style={{ padding: '9px 24px', background: '#328470', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

