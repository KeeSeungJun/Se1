const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

let modal;
let map;
let currentScore = 0;

function getRandomScore(min = 70, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function handleCurrentMap() {
    const container = document.getElementById('map');
    const pos = await getCurrentPosition();
    const center = new kakao.maps.LatLng(pos.latitude, pos.longitude);
    const options = {
        center: center,
        level: 7
    };
    map = new kakao.maps.Map(container, options);
    new kakao.maps.Marker({
        map: map,
        position: center,
        title: '현재 위치'
    });
}

async function handleGet(jobListBox) {
    modal = document.getElementById('job-modal');
    const markerImage = new kakao.maps.MarkerImage(imageSrc, new kakao.maps.Size(24, 35));

    function showJobModal(data) {
        currentScore = data.score;

        document.getElementById('modal-title').innerText  = `${data.job_task} 상세정보`;
        document.getElementById('job-name').innerText     = data.job_title;
        document.getElementById('salary').innerText       = data.job_salary;
        document.getElementById('location').innerText     = data.job_address;
        document.getElementById('company').innerText      = data.job_desc;
        document.getElementById('nearby').innerText       = data.job_nearby_subway;
        document.getElementById('modal-score').innerText  = `추천 점수 : ${currentScore}/100`;

        if (data.reason) {
            document.getElementById('reason-working').innerText     = data.reason.working     || '';
            document.getElementById('reason-salary').innerText      = data.reason.salary      || '';
            document.getElementById('reason-company').innerText     = data.reason.company     || '';
            document.getElementById('reason-competition').innerText = data.reason.competition || '';
            document.getElementById('reason-total').innerText       = data.reason.total       || '';
        }

        modal.style.display = 'flex';

        const modalMap = document.getElementById('modal-map');
        modalMap.innerHTML = '';
        const modalMapInstance = new kakao.maps.Map(modalMap, {
            center: new kakao.maps.LatLng(data.job_latitude, data.job_longitude),
            level: 3
        });

        new kakao.maps.Marker({
            map: modalMapInstance,
            position: new kakao.maps.LatLng(data.job_latitude, data.job_longitude),
            title: data.job_title,
            image: markerImage
        });
    }

    showLoading();
    try {
        const { list: jobs } = await AjaxUtils.get('http://localhost:8080/api/job');

        jobs.sort((a, b) => b.score - a.score);

        jobListBox.innerHTML = '';

        jobs.forEach((data, idx) => {
            const item = document.createElement('div');
            item.className = 'job-item';
            item.innerHTML = `${data.job_title} (<span>${data.score}</span>점)`;
            item.addEventListener('click', () => showJobModal(data));
            jobListBox.appendChild(item);

            const marker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(data.job_latitude, data.job_longitude),
                title: data.job_title,
                image: markerImage,
                clickable: true
            });
            kakao.maps.event.addListener(marker, 'click', () => showJobModal(data));
        });

        window.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

    } catch (err) {
        console.error(err);
    } finally {
        hideLoading();
    }
}

window.onload = function () {
    const jobListBox = document.getElementById('job-list-box');
    handleCurrentMap();
    handleGet(jobListBox);
};

function closeModal() {
    document.getElementById('job-modal').style.display = 'none';
}

function closeReasonModal() {
    document.getElementById('reason-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const applyButtons = document.querySelectorAll('.apply-btn');
    applyButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            alert('신청이 완료되었습니다!');
        });
    });

    const modalScore = document.getElementById("modal-score");
    if (modalScore) {
        modalScore.style.cursor = "pointer";
        modalScore.addEventListener("click", function () {
            document.getElementById("reason-score").innerText = currentScore;
            document.getElementById("reason-modal").style.display = "flex";
        });
    }
});
