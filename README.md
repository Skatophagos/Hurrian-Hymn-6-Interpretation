# Hurrian Hymn h.6: Interpretation workbench

An interactive page for the Hurrian hymn h.6 from Ugarit (RS 15.30 + 15.49 + 17.387). It sets the major readings of the notation side by side and lets you hear them on a nine-string lyre.

**Open it:** <https://skatophagos.github.io/Hurrian-Hymn-6-Interpretation/>
(中文版：<https://skatophagos.github.io/Hurrian-Hymn-6-Interpretation/?lang=zh>)

The page is in English and Chinese; switch with the English / 中文 buttons at the top. It is a single self-contained file, [`index.html`](index.html), so you can also download it and open it in any browser.

## What is in it

- **Reading engine**: the text and notation of h.6, realised under thirteen published readings (Wulstan, Kilmer, Duchesne-Guillemin, Vitale, Černý, West, Koitabashi, Dumbrill 1998/2005 and 2014, Monzo, Krispijn, Hagel, Gibson), with every parameter adjustable.
- **Retuning**: the UET VII 74 tuning cycle and the CBS 1766 star.
- **String pairs**: the fourteen named intervals of CBS 10996 and Nabnītu XXXII.
- **Editions**, **Readings compared**, **Appendix A** (sign by sign), **Appendix B** (the other Hurrian pieces, from Laroche's or Dumbrill's text) and **Sources**.

## Sources and rights

- No photographs of the tablets are included.
- Stefan Hagel's MIDI realisations (*Music of the Ancient Near East*, ÖAW) are not included. The page reproduces his rules and links to [his site](https://www.oeaw.ac.at/kal/mane/).
- Laroche's readings of the other pieces (PRU III; Ugaritica V) are used as cited data.
- Every reading is credited to its author in the page; the full bibliography is under **Sources**.

## Versions

- **v2** (November 2026): rewritten as a standalone page, with thirteen readings, the retuning and string-pair views, both appendices, and English and Chinese in one page.
- **v1** (August 2026): the first explorer with scholar presets, kept in the history as [commit f1e6a49](https://github.com/Skatophagos/Hurrian-Hymn-6-Interpretation/tree/f1e6a498113d07568fa6c2f5905537d4646a826e).

## Building

`index.html` is generated from the files in [`src/`](src): `h6/` holds the English page, engine and data, and `h6zh/` derives the Chinese edition from them. Run `python3 src/build.py` to rebuild.
