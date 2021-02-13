// ==UserScript==
// @name         csgostats.gg Rating 2.0
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add HLTV's Rating 2.0 to csgostats.gg match page scoreboard
// @author       bim
// @match        https://csgostats.gg/match/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict'

  const tdDict = {
    name: 0,
    kills: 2,
    deaths: 3,
    assists: 4,
    adr: 7,
    kast: 33
  }

  const ratingPositiveColor = '#597E35'
  const ratingNegativeColor = '#AB3D40'

  function calcRating20 (adr, kast, kpr, dpr, impact) {
    // We're using Daves reverse engineered formula: https://flashed.gg/posts/reverse-engineering-hltv-rating/
    return (0.73 * kast) + (0.3591 * kpr) + (-0.5329 * dpr) + (0.2372 * impact) + (0.0032 * adr) + 0.1587
  }

  function getRowsTds (row) {
    return row.querySelectorAll('td')
  }

  function insertRating20ToScoreboard (row, rating20) {
    const color = ((rating20 >= 1.0) ? ratingPositiveColor : ratingNegativeColor)
    row.insertAdjacentHTML('beforeend', `<td class="split" style="color: ${color};" align="center">${Math.round(rating20 * 100) / 100}</td>`)
  }

  function insertRating20ScoreboardHeader () {
    const scoreboardHeaderRows = document.querySelectorAll('#match-scoreboard > thead > tr')
    scoreboardHeaderRows[1].insertAdjacentHTML('beforeend', '<th><span>Rating 2.0</span></th>')
  }

  function executeAdrRegex (str) {
    const regex = /(?<damage>[0-9]+) over (?<rounds>[0-9]+) rounds/g
    return regex.exec(str)
  }

  function getRoundsFromRow (row) {
    return parseInt(executeAdrRegex(getRowsTds(row)[tdDict.adr].title).groups.rounds)
  }

  function getDamageFromRow (row) {
    return parseInt(executeAdrRegex(getRowsTds(row)[tdDict.adr].title).groups.damage)
  }

  function calcSomethingPerRound (value, rounds) {
    return value * 1.0 / rounds
  }

  function getKastFromRow (row) {
    return parseFloat(getRowsTds(row)[tdDict.kast].innerText) / 100.0
  }

  function getKillsFromRow (row) {
    return getRowsTds(row)[tdDict.kills].innerText
  }

  function getDeathsFromRow (row) {
    return getRowsTds(row)[tdDict.deaths].innerText
  }

  function getAssistsFromRow (row) {
    return getRowsTds(row)[tdDict.assists].innerText
  }

  function calcImpact (kpr, apr) {
    return 2.13 * kpr + 0.42 * apr - 0.41
  }

  // eslint-disable-next-line no-unused-vars
  function getPlayerNameFromRow (row) {
    return getRowsTds(row)[tdDict.name].querySelector('a > span').innerText
  }

  function getScoreboardRows () {
    const scoreboards = document.querySelectorAll('#match-scoreboard > tbody')
    const tPlayersRows = scoreboards[0].querySelectorAll('tr')
    const ctPlayersRows = scoreboards[2].querySelectorAll('tr')

    return Array.from(tPlayersRows.values()).concat(Array.from(ctPlayersRows.values()))
  }

  insertRating20ScoreboardHeader()
  getScoreboardRows().forEach(row => {
    const rounds = getRoundsFromRow(row)
    const damage = getDamageFromRow(row)
    const adr = calcSomethingPerRound(damage, rounds)
    const kast = getKastFromRow(row)
    const kills = getKillsFromRow(row)
    const deaths = getDeathsFromRow(row)
    const assists = getAssistsFromRow(row)
    const kpr = calcSomethingPerRound(kills, rounds)
    const dpr = calcSomethingPerRound(deaths, rounds)
    const apr = calcSomethingPerRound(assists, rounds)
    const impact = calcImpact(kpr, apr)
    const rating20 = calcRating20(adr, kast, kpr, dpr, impact)
    insertRating20ToScoreboard(row, rating20)
  })
})()
