import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const sceneContainer = document.querySelector('#sceneContainer');
const panelTitle = document.querySelector('#panelTitle');
const panelDescription = document.querySelector('#panelDescription');
const mentionMetric = document.querySelector('#mentionMetric');
const remoteMetric = document.querySelector('#remoteMetric');
const juniorMetric = document.querySelector('#juniorMetric');
const salaryMetric = document.querySelector('#salaryMetric');
const jobList = document.querySelector('#jobList');
const jobCount = document.querySelector('#jobCount');
const skillCount = document.querySelector('#skillCount');
const remotePercent = document.querySelector('#remotePercent');

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const bars = [];
let selectedBar = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071017);
scene.fog = new THREE.Fog(0x071017, 26, 70);

const camera = new THREE.PerspectiveCamera(55, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
camera.position.set(8, 12, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.shadowMap.enabled = true;
sceneContainer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
sceneContainer.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.15;
controls.minDistance = 12;
controls.maxDistance = 42;

const ambientLight = new THREE.HemisphereLight(0x9fd8ff, 0x0b1720, 2.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(8, 18, 10);
keyLight.castShadow = true;
scene.add(keyLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 28, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x0d1b26, roughness: 0.92, metalness: 0.08 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.03;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(44, 22, 0x224457, 0x142c38);
grid.position.y = 0.01;
scene.add(grid);

async function init() {
  const jobs = await loadJobs();
  const skills = transformJobsToSkillSignals(jobs);
  updateHeaderStats(jobs, skills);
  renderBars(skills);
  updatePanelWithOverview(jobs, skills);
  animate();
}

async function loadJobs() {
  const response = await fetch('./data/jobsData.json');
  if (!response.ok) {
    throw new Error('Could not load jobsData.json');
  }
  return response.json();
}

function transformJobsToSkillSignals(jobs) {
  const skillMap = new Map();

  for (const job of jobs) {
    for (const skill of job.skills) {
      if (!skillMap.has(skill)) {
        skillMap.set(skill, {
          skill,
          count: 0,
          jobs: [],
          remoteCount: 0,
          juniorCount: 0,
          salaryTotal: 0,
          salarySamples: 0
        });
      }

      const signal = skillMap.get(skill);
      signal.count += 1;
      signal.jobs.push(job);

      if (job.location.toLowerCase() === 'remote') signal.remoteCount += 1;
      if (job.level.toLowerCase() === 'junior') signal.juniorCount += 1;

      if (Number.isFinite(job.salaryMin) && Number.isFinite(job.salaryMax)) {
        signal.salaryTotal += (job.salaryMin + job.salaryMax) / 2;
        signal.salarySamples += 1;
      }
    }
  }

  return [...skillMap.values()]
    .map((signal) => ({
      ...signal,
      avgSalary: signal.salarySamples ? Math.round(signal.salaryTotal / signal.salarySamples) : null
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);
}

function updateHeaderStats(jobs, skills) {
  const remoteJobs = jobs.filter((job) => job.location.toLowerCase() === 'remote').length;
  jobCount.textContent = jobs.length;
  skillCount.textContent = skills.length;
  remotePercent.textContent = `${Math.round((remoteJobs / jobs.length) * 100)}%`;
}

function renderBars(skills) {
  const maxCount = Math.max(...skills.map((skill) => skill.count));
  const spacing = 2.3;
  const startX = -((skills.length - 1) * spacing) / 2;

  skills.forEach((skillSignal, index) => {
    const height = THREE.MathUtils.mapLinear(skillSignal.count, 0, maxCount, 0, 9);
    const geometry = new THREE.BoxGeometry(1.2, height, 1.2);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.46 - index * 0.014, 0.72, 0.5),
      roughness: 0.48,
      metalness: 0.18
    });

    const bar = new THREE.Mesh(geometry, material);
    bar.position.set(startX + index * spacing, height / 2, 0);
    bar.castShadow = true;
    bar.receiveShadow = true;
    bar.userData = skillSignal;

    const labelElement = document.createElement('div');
    labelElement.className = 'skill-label';
    labelElement.textContent = skillSignal.skill;

    const label = new CSS2DObject(labelElement);
    label.position.set(0, height + 0.45, 0);
    bar.add(label);

    scene.add(bar);
    bars.push(bar);
  });
}

function updatePanelWithOverview(jobs, skills) {
  panelTitle.textContent = 'Skill demand overview';
  panelDescription.textContent = 'This static dataset is transformed into skill-frequency signals, then rendered as interactive 3D bars. It is designed so a real job API can replace the local JSON later.';
  mentionMetric.textContent = skills[0]?.count ?? '—';
  remoteMetric.textContent = `${jobs.filter((job) => job.location === 'Remote').length}`;
  juniorMetric.textContent = `${jobs.filter((job) => job.level === 'junior').length}`;
  salaryMetric.textContent = formatSalary(averageSalary(jobs));
  jobList.innerHTML = skills.slice(0, 5).map((signal) => `<li><strong>${signal.skill}</strong> appears in ${signal.count} postings.</li>`).join('');
}

function updatePanelForSkill(skillSignal) {
  panelTitle.textContent = skillSignal.skill;
  panelDescription.textContent = `${skillSignal.skill} appears across ${skillSignal.count} job postings in this sample dataset. This view connects raw job records to skill demand, remote availability, seniority, and salary range signals.`;
  mentionMetric.textContent = skillSignal.count;
  remoteMetric.textContent = `${skillSignal.remoteCount}/${skillSignal.count}`;
  juniorMetric.textContent = `${skillSignal.juniorCount}/${skillSignal.count}`;
  salaryMetric.textContent = formatSalary(skillSignal.avgSalary);

  jobList.innerHTML = skillSignal.jobs
    .slice(0, 7)
    .map((job) => {
      const salary = formatSalary((job.salaryMin + job.salaryMax) / 2);
      return `<li><strong>${job.title}</strong><br>${job.company} · ${job.location} · ${job.level} · ${salary}</li>`;
    })
    .join('');
}

function averageSalary(jobs) {
  const salaryValues = jobs
    .filter((job) => Number.isFinite(job.salaryMin) && Number.isFinite(job.salaryMax))
    .map((job) => (job.salaryMin + job.salaryMax) / 2);

  return salaryValues.reduce((sum, value) => sum + value, 0) / salaryValues.length;
}

function formatSalary(value) {
  if (!Number.isFinite(value)) return '—';
  return `$${Math.round(value / 1000)}k`;
}

function setSelectedBar(bar) {
  if (selectedBar && selectedBar !== bar) {
    selectedBar.scale.set(1, 1, 1);
    selectedBar.material.emissive.setHex(0x000000);
  }

  selectedBar = bar;
  selectedBar.scale.set(1.08, 1.04, 1.08);
  selectedBar.material.emissive.setHex(0x123b36);
  updatePanelForSkill(bar.userData);
}

function handlePointerMove(event) {
  const intersected = getIntersectedBar(event);
  renderer.domElement.style.cursor = intersected ? 'pointer' : 'grab';
}

function handleClick(event) {
  const intersected = getIntersectedBar(event);
  if (intersected) setSelectedBar(intersected);
}

function getIntersectedBar(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(bars, false)[0]?.object ?? null;
}

function handleResize() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

renderer.domElement.addEventListener('pointermove', handlePointerMove);
renderer.domElement.addEventListener('click', handleClick);
window.addEventListener('resize', handleResize);

init().catch((error) => {
  panelTitle.textContent = 'Data failed to load';
  panelDescription.textContent = error.message;
});
