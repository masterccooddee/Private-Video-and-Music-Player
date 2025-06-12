import chalk from 'chalk';

export function loading(now, total, startTime) {
    const total_sign = 40;
    const percent = now / total;
    const fin = chalk.green('+'.repeat(Math.floor(total_sign * percent)));
    const not_fin = chalk.redBright('-'.repeat(total_sign - Math.floor(total_sign * percent)));
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇','⠏']; // 動態符號
    const spinnerChar = (now == total) ? chalk.green('✔') : spinner[now % spinner.length]; // 根據時間選擇符號
    const percent_str = Math.floor(percent * 100);

    // 計算速度
    const elapsedTime = (Date.now() - startTime) / 1000; // 已用時間（秒）
    const elapsedMin = Math.floor(elapsedTime / 60); // 已用時間（分鐘）
    const elapsedSec = Math.floor(elapsedTime % 60); // 已用時間（秒）
    const elapsedTimeStr = `${elapsedMin.toString().padStart(2, '0')}:${elapsedSec.toString().padStart(2, '0')}`; // 格式化 分:秒

    const speed = now / elapsedTime || 0; // 每秒處理的進度數量
    const speedStr = speed.toFixed(2); // 格式化速度到小數點後兩位
    // 計算剩餘時間
    const remainingTime = (total - now) / speed || 0; // 剩餘時間（秒）
    const remainingMin = Math.floor(remainingTime / 60); // 剩餘時間（分鐘）
    const remainingSec = Math.floor(remainingTime % 60); // 剩餘時間（秒）
    const remainingTimeStr = now == total ? '--:--' : `${remainingMin.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0') }`; // 格式化 分:秒

    const str = `\r${spinnerChar} [${elapsedTimeStr}] |${fin}${not_fin}| ${percent_str}%  ${speedStr} Files/s (ETA: ${remainingTimeStr})                       `;
    process.stdout.write(str);
}

