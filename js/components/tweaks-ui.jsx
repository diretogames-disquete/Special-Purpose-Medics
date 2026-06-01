/* global React */
const { useEffect, useMemo, useRef } = React;
const { TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio } = window;

/* The Tweaks UI for the PFC dashboard.
   Owns: theme switch (dark/light), sound on/off + volume,
   ECG wave on/off, heart pulse on/off, density, student-notes visibility. */
function PCCTweaks({ tweaks, setTweak, currentVitals }) {
  // Apply theme to <html data-theme>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme === 'light' ? 'light' : 'dark');
  }, [tweaks.theme]);

  // Apply density to <body>
  useEffect(() => {
    document.body.setAttribute('data-density', tweaks.density);
  }, [tweaks.density]);

  // Apply ECG visibility
  useEffect(() => {
    document.body.classList.toggle('no-ecg', !tweaks.ecgWave);
  }, [tweaks.ecgWave]);

  // Sound enabled state
  useEffect(() => {
    window.PCC_SOUND.setEnabled(!!tweaks.soundEnabled);
  }, [tweaks.soundEnabled]);

  // Sound volume
  useEffect(() => {
    window.PCC_SOUND.setVolume((tweaks.soundVolume ?? 25) / 100);
  }, [tweaks.soundVolume]);

  // Update sound vitals when scenario changes
  useEffect(() => {
    if (!currentVitals) {
      window.PCC_SOUND.setVitals({ hr: 0, spo2: 0, critical: false });
      return;
    }
    const hr = +currentVitals.hr || 0;
    const spo2 = +currentVitals.spo2 || 0;
    // critical if HR way off, SpO2 < 90, BP < 90/?, temp >= 39 etc.
    const bpSys = currentVitals.bp ? +currentVitals.bp.split('/')[0] : null;
    const temp = +currentVitals.temp || 0;
    const critical = (hr && (hr < 50 || hr > 130)) || (spo2 && spo2 < 90) || (bpSys && bpSys < 90) || (temp && temp >= 39);
    window.PCC_SOUND.setVitals({ hr, spo2, critical });
  }, [currentVitals]);

  // Lub-Dub
  useEffect(() => {
    window.PCC_SOUND.setLubDub(!!tweaks.lubDub);
  }, [tweaks.lubDub]);

  return (
    <TweaksPanel title="TWEAKS · PFC">
      <TweakSection label="Display" />
      <TweakRadio
        label="Theme"
        value={tweaks.theme}
        options={['dark', 'light']}
        onChange={v => setTweak('theme', v)}
      />
      <TweakRadio
        label="Density"
        value={tweaks.density}
        options={['compact', 'regular', 'comfy']}
        onChange={v => setTweak('density', v)}
      />
      <TweakToggle
        label="ECG waveform"
        value={tweaks.ecgWave}
        onChange={v => setTweak('ecgWave', v)}
      />
      <TweakToggle
        label="Heart pulse"
        value={tweaks.pulseHeart}
        onChange={v => setTweak('pulseHeart', v)}
      />

      <TweakSection label="Audio · Telemetry" />
      <TweakToggle
        label="Sound"
        value={tweaks.soundEnabled}
        onChange={v => setTweak('soundEnabled', v)}
      />
      <TweakToggle
        label="Lub-Dub (S₁ · S₂)"
        value={tweaks.lubDub}
        onChange={v => setTweak('lubDub', v)}
      />
      <TweakSlider
        label="Volume"
        value={tweaks.soundVolume}
        min={0} max={100} step={5}
        unit="%"
        onChange={v => setTweak('soundVolume', v)}
      />

      <TweakSection label="Content" />
      <TweakToggle
        label="Show training notes"
        value={tweaks.showStudentNotes}
        onChange={v => setTweak('showStudentNotes', v)}
      />
    </TweaksPanel>
  );
}

window.PCCTweaks = PCCTweaks;
