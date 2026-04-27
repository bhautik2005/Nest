const PDFDocument = require('pdfkit');
const Billing = require('../modals/billing');
const Home = require('../modals/home');
const mongoose = require('mongoose');

exports.calculatePrice = async (req, res, next) => {
    try {
        const { homeId, checkInDate, checkOutDate, guests } = req.body;
        const home = await Home.findById(homeId);

        if (!home) {
            return res.status(404).json({ error: 'Home not found' });
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        if (checkOut <= checkIn) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }

        const Reservation = require('../modals/reservation');
        const existingReservations = await Reservation.find({ homeId: homeId, status: 'Paid' });
        let isOverlap = false;

        for (let r of existingReservations) {
            const rIn = new Date(r.checkIn);
            const rOut = new Date(r.checkOut);
            rIn.setHours(0, 0, 0, 0);
            rOut.setHours(0, 0, 0, 0);

            // A booking overlaps if: (newCheckIn < existingCheckOut) AND (newCheckOut > existingCheckIn)
            if (checkIn < rOut && checkOut > rIn) {
                isOverlap = true;
                break;
            }
        }

        if (isOverlap) {
            return res.json({ status: 'Not Available' });
        }

        const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

        const pricePerNight = home.price;
        const pricePerGuest = 0; // Extendable if host defines it

        const baseAmount = pricePerNight * nights;
        const guestCharges = pricePerGuest * guests * nights;
        const subtotal = baseAmount + guestCharges;
        const taxes = parseFloat((subtotal * 0.10).toFixed(2)); // 10% tax
        const totalAmount = parseFloat((subtotal + taxes).toFixed(2));

        res.json({
            status: "Available",
            nights,
            pricePerNight,
            pricePerGuest,
            baseAmount,
            guestCharges,
            subtotal,
            taxes,
            totalAmount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createBilling = async (req, res, next) => {
    try {
        const { homeId, checkInDate, checkOutDate, guests, totalAmount, subtotal, taxes, pricePerNight, nights } = req.body;
        const userId = req.session.user._id;

        const invoiceId = 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

        const newBilling = new Billing({
            user: userId,
            home: homeId,
            checkInDate,
            checkOutDate,
            nights,
            guests,
            pricePerNight,
            subtotal,
            taxes,
            totalAmount,
            invoiceId
        });

        await newBilling.save();

        res.json({ success: true, billingId: newBilling._id, invoiceId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create bill' });
    }
};

exports.getBillingDetails = async (req, res, next) => {
    try {
        const billing = await Billing.findById(req.params.id).populate('home').populate('user');
        if (!billing) {
            return res.status(404).json({ error: 'Billing not found' });
        }
        res.json(billing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// exports.downloadInvoice = async (req, res, next) => {
//     try {
//         const billing = await Billing.findById(req.params.id)
//             .populate({ path: 'home', populate: { path: 'userId' } })
//             .populate('user');
//         if (!billing) {
//             return res.status(404).send('Billing not found');
//         }

//         const doc = new PDFDocument({ margin: 50 });
//         let filename = `invoice-${billing.invoiceId}.pdf`;

//         res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
//         res.setHeader('Content-type', 'application/pdf');

//         doc.pipe(res);

//         // Header
//         doc.fontSize(25).fillColor('#ff385c').text('Airbnb Clone Invoice', { align: 'center' });
//         doc.moveDown();

//         // Invoice Details
//         doc.fillColor('#000000').fontSize(14).text(`Invoice ID: ${billing.invoiceId}`);
//         doc.text(`Date Issued: ${new Date(billing.createdAt).toLocaleDateString()}`);
//         doc.moveDown();

//         // Party Details
//         doc.fontSize(16).text('Host Details:', { underline: true });
//         if (billing.home && billing.home.userId) {
//             doc.fontSize(12).text(`Name: ${billing.home.userId.firstName} ${billing.home.userId.lastName || ''}`);
//             doc.text(`Email: ${billing.home.userId.email}`);
//         } else {
//             doc.fontSize(12).text(`Name: Host Not Available`);
//             doc.text(`Email: N/A`);
//         }
//         doc.moveDown();

//         doc.fontSize(16).text('Property Details:', { underline: true });
//         doc.fontSize(12).text(`Home: ${billing.home.houseName}`);
//         doc.text(`Location: ${billing.home.location}`);
//         doc.text(`Check-in: ${new Date(billing.checkInDate).toLocaleDateString()}`);
//         doc.text(`Check-out: ${new Date(billing.checkOutDate).toLocaleDateString()}`);
//         doc.text(`Guests: ${billing.guests}`);
//         doc.text(`Total Nights: ${billing.nights}`);

//         doc.moveDown(2);

//         // Financials
//         doc.fontSize(16).text('Charges Breakdown:', { underline: true });
//         doc.fontSize(12).text(`Price per night: $${billing.pricePerNight}`);
//         doc.text(`Subtotal (${billing.nights} nights): $${billing.subtotal}`);
//         doc.text(`Taxes & Fees: $${billing.taxes}`);

//         doc.moveDown();
//         doc.rect(50, doc.y, 500, 1).fill('#cccccc');
//         doc.moveDown();

//         doc.fontSize(18).fillColor('#ff385c').text(`Total Amount: $${billing.totalAmount}`, { align: 'right' });

//         doc.end();

//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Error generating invoice. Make sure pdfkit is installed.');
//     }
// };
exports.downloadInvoice = async (req, res) => {
    try {
        const billingId = req.params.id;

        // ✅ Validate ID
        if (!mongoose.Types.ObjectId.isValid(billingId)) {
            return res.status(400).json({ message: 'Invalid billing ID' });
        }

        const billing = await Billing.findById(billingId)
            .populate({ path: 'home', populate: { path: 'userId' } })
            .populate('user');

        if (!billing) {
            return res.status(404).json({ message: 'Billing not found' });
        }

        // ✅ Authorization
        if (billing.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const filename = `invoice-${billing.invoiceId}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // ─── CONSTANTS ────────────────────────────────────────────────────────
        const W = doc.page.width;          // 595
        const MARGIN = 50;
        const COL_RIGHT = W - MARGIN;
        const BRAND = '#FF385C';
        const DARK = '#1A1A2E';
        const MID = '#4A4A68';
        const LIGHT = '#F7F7FB';
        const RULE = '#E2E2F0';
        const WHITE = '#FFFFFF';
        const currency = billing.currency || '₹';

        // ─── HELPER FUNCTIONS ─────────────────────────────────────────────────

        /** Horizontal rule */
        const hr = (y, color = RULE, thickness = 0.5) => {
            doc.save()
                .moveTo(MARGIN, y).lineTo(COL_RIGHT, y)
                .lineWidth(thickness).strokeColor(color).stroke()
                .restore();
        };

        /** Filled rectangle */
        const rect = (x, y, w, h, color) => {
            doc.save().rect(x, y, w, h).fill(color).restore();
        };

        /** Two-column key/value row */
        const kvRow = (label, value, y, labelColor = MID, valueColor = DARK, fontSize = 11) => {
            doc.fontSize(fontSize).fillColor(labelColor).text(label, MARGIN, y, { width: 220 });
            doc.fontSize(fontSize).fillColor(valueColor).text(value, MARGIN + 230, y, {
                width: COL_RIGHT - MARGIN - 230,
                align: 'right',
            });
        };

        // ─── 1. HEADER BAND ───────────────────────────────────────────────────
        rect(0, 0, W, 110, BRAND);

        // Brand name
        doc.fontSize(28)
            .fillColor(WHITE)
            .font('Helvetica-Bold')
            .text('NextFest', MARGIN, 28, { continued: true })
            .font('Helvetica')
            .fontSize(14)
            .fillColor('rgba(255,255,255,0.75)')
            .text('  ·  Tax Invoice', { baseline: 'middle' });

        // Invoice number badge (top-right)
        const badgeX = W - MARGIN - 160;
        rect(badgeX, 22, 160, 32, 'rgba(0,0,0,0.18)');
        doc.fontSize(9)
            .fillColor('rgba(255,255,255,0.70)')
            .text('INVOICE NUMBER', badgeX, 26, { width: 160, align: 'center' });
        doc.fontSize(11)
            .fillColor(WHITE)
            .font('Helvetica-Bold')
            .text(`#${billing.invoiceId}`, badgeX, 38, { width: 160, align: 'center' });

        // Date under brand
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('rgba(255,255,255,0.75)')
            .text(
                `Issued: ${new Date(billing.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric',
                })}`,
                MARGIN, 68
            );

        // ─── 2. STATUS RIBBON ────────────────────────────────────────────────
        rect(0, 110, W, 34, LIGHT);
        hr(110, RULE, 1);
        hr(144, RULE, 1);

        const statusLabel = (billing.paymentStatus || 'PAID').toUpperCase();
        const statusColor = statusLabel === 'PAID' ? '#27AE60' : '#E67E22';
        const statusBg = statusLabel === 'PAID' ? '#EAF9F0' : '#FEF5EC';

        rect(MARGIN, 117, 64, 20, statusBg);
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor(statusColor)
            .text(statusLabel, MARGIN, 121, { width: 64, align: 'center' });

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(MID)
            .text(
                `Payment Method: ${billing.paymentMethod || 'Online'}`,
                MARGIN + 80, 121
            );

        doc.fontSize(9)
            .fillColor(MID)
            .text(
                `Booking Ref: ${billing.invoiceId}`,
                0, 121,
                { width: COL_RIGHT - 10, align: 'right' }
            );

        // ─── 3. TWO-COLUMN INFO CARDS ────────────────────────────────────────
        const cardTop = 162;
        const cardH = 110;
        const cardGap = 12;
        const cardW = (W - MARGIN * 2 - cardGap) / 2;

        const host = billing.home?.userId;

        // Host card
        rect(MARGIN, cardTop, cardW, cardH, LIGHT);
        doc.save().rect(MARGIN, cardTop, 3, cardH).fill(BRAND).restore();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(BRAND)
            .text('HOST DETAILS', MARGIN + 12, cardTop + 10);

        doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK)
            .text(
                `${host?.firstName || 'N/A'} ${host?.lastName || ''}`.trim(),
                MARGIN + 12, cardTop + 26
            );

        doc.fontSize(10).font('Helvetica').fillColor(MID)
            .text(host?.email || 'N/A', MARGIN + 12, cardTop + 44);

        doc.fontSize(10).fillColor(MID)
            .text(host?.phone || '', MARGIN + 12, cardTop + 60);

        // Property card
        const card2X = MARGIN + cardW + cardGap;
        rect(card2X, cardTop, cardW, cardH, LIGHT);
        doc.save().rect(card2X, cardTop, 3, cardH).fill(BRAND).restore();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(BRAND)
            .text('PROPERTY', card2X + 12, cardTop + 10);

        doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK)
            .text(billing.home?.houseName || 'N/A', card2X + 12, cardTop + 26, {
                width: cardW - 24,
                ellipsis: true,
                lineBreak: false,
            });

        doc.fontSize(10).font('Helvetica').fillColor(MID)
            .text(billing.home?.location || 'N/A', card2X + 12, cardTop + 44, {
                width: cardW - 24,
            });

        // ─── 4. STAY DETAILS STRIP ───────────────────────────────────────────
        const stripTop = cardTop + cardH + 18;
        rect(0, stripTop, W, 56, DARK);

        const cols = [
            { label: 'CHECK-IN', value: new Date(billing.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
            { label: 'CHECK-OUT', value: new Date(billing.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
            { label: 'NIGHTS', value: `${billing.nights}` },
            { label: 'GUESTS', value: `${billing.guests}` },
        ];

        const colW = (W - MARGIN * 2) / cols.length;
        cols.forEach((col, i) => {
            const cx = MARGIN + i * colW;
            // divider between columns
            if (i > 0) {
                doc.save()
                    .moveTo(cx, stripTop + 10).lineTo(cx, stripTop + 46)
                    .lineWidth(0.5).strokeColor('rgba(255,255,255,0.15)').stroke()
                    .restore();
            }
            doc.fontSize(8).font('Helvetica-Bold').fillColor('rgba(255,255,255,0.55)')
                .text(col.label, cx, stripTop + 10, { width: colW, align: 'center' });
            doc.fontSize(13).font('Helvetica-Bold').fillColor(WHITE)
                .text(col.value, cx, stripTop + 26, { width: colW, align: 'center' });
        });

        // ─── 5. CHARGES TABLE ────────────────────────────────────────────────
        let y = stripTop + 56 + 24;

        doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK)
            .text('Charges Breakdown', MARGIN, y);
        y += 20;
        hr(y, RULE, 1);
        y += 14;

        // Table header row
        rect(MARGIN, y, COL_RIGHT - MARGIN, 26, BRAND);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE)
            .text('DESCRIPTION', MARGIN + 10, y + 8, { width: 220 });
        doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE)
            .text('AMOUNT', MARGIN + 10, y + 8, { width: COL_RIGHT - MARGIN - 20, align: 'right' });
        y += 26;

        // Table rows
        const rows = [
            { desc: `Price per Night (${billing.nights} × ${currency}${billing.pricePerNight})`, amt: `${currency}${billing.subtotal}` },
            { desc: 'Taxes & Fees', amt: `${currency}${billing.taxes}` },
        ];

        rows.forEach((row, i) => {
            rect(MARGIN, y, COL_RIGHT - MARGIN, 32, i % 2 === 0 ? WHITE : LIGHT);
            doc.fontSize(10).font('Helvetica').fillColor(DARK)
                .text(row.desc, MARGIN + 10, y + 10, { width: 300 });
            doc.fontSize(10).font('Helvetica').fillColor(DARK)
                .text(row.amt, MARGIN + 10, y + 10, { width: COL_RIGHT - MARGIN - 20, align: 'right' });
            y += 32;
        });

        hr(y, RULE, 1);

        // ─── 6. TOTAL BAR ─────────────────────────────────────────────────────
        y += 1;
        rect(MARGIN, y, COL_RIGHT - MARGIN, 48, BRAND);

        doc.fontSize(13).font('Helvetica-Bold').fillColor(WHITE)
            .text('TOTAL AMOUNT DUE', MARGIN + 10, y + 16, { width: 250 });
        doc.fontSize(18).font('Helvetica-Bold').fillColor(WHITE)
            .text(`${currency}${billing.totalAmount}`, MARGIN + 10, y + 12, {
                width: COL_RIGHT - MARGIN - 20,
                align: 'right',
            });
        y += 48;

        // ─── 7. FOOTER ───────────────────────────────────────────────────────
        const footerTop = doc.page.height - 70;
        hr(footerTop, RULE, 1);

        doc.fontSize(8).font('Helvetica').fillColor(MID)
            .text(
                'Thank you for booking with NextFest. For support, contact support@nextfest.com',
                MARGIN, footerTop + 10,
                { width: W - MARGIN * 2, align: 'center' }
            );

        doc.fontSize(8).fillColor(RULE)
            .text(
                `Generated on ${new Date().toLocaleString('en-IN')}  ·  Invoice ${billing.invoiceId}`,
                MARGIN, footerTop + 26,
                { width: W - MARGIN * 2, align: 'center' }
            );

        doc.end();

    } catch (err) {
        console.error('Invoice Error:', err);
        res.status(500).json({ message: 'Error generating invoice' });
    }
};