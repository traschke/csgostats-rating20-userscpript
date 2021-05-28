// ==UserScript==
// @name         csgostats.gg Rating 2.0
// @description  Add HLTV's Rating 2.0 to csgostats.gg match page scoreboard
// @version      1.1.2
// @author       traschke
// @namespace    https://github.com/traschke/csgostats-rating20-userscript
// @supportURL   https://github.com/traschke/csgostats-rating20-userscript/issues
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
    kast: 9,
    rating20: 11
  }

  const scoreboardNthDict = {
    t: 1,
    ct: 3
  }

  const colorDict = {
    ratingPositive: '#7ED321',
    ratingAverage: '#D39121',
    ratingNegative: '#D0021B'
  }

  function calcRating20 (adr, kast, kpr, dpr, impact) {
    // We're using Daves reverse engineered formula: https://flashed.gg/posts/reverse-engineering-hltv-rating/
    return (0.73 * kast) + (0.3591 * kpr) + (-0.5329 * dpr) + (0.2372 * impact) + (0.0032 * adr) + 0.1587
  }

  function getRowsTds (row) {
    return row.querySelectorAll('td')
  }

  function insertRating20ToScoreboard (row, rating20) {
    const roundedRating20 = Math.round(rating20 * 100) / 100
    const color = ((roundedRating20 >= 1.1) ? colorDict.ratingPositive : (roundedRating20 >= 1.0) ? colorDict.ratingAverage : colorDict.ratingNegative)
    row.insertCell(tdDict.rating20).outerHTML = `<td align="center"><span style="border-radius:4px; padding:2px; display:block; color:#fff; width:43px; text-align:center; background: ${color}">${roundedRating20}</span></td>`
  }

  function insertRating20ScoreboardHeader () {
    const scoreboardHeaderRows = document.querySelectorAll('#match-scoreboard > thead > tr.absolute-spans')
    scoreboardHeaderRows.forEach(headerRow => {
      headerRow.insertCell(tdDict.rating20).outerHTML = '<th><span data-toggle="tooltip" title="" data-original-title="HLTV Rating 2.0">Rating 2.0</span></th>'
    })
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

  function getScoreboards () {
    return document.querySelectorAll(`#match-scoreboard > tbody:nth-of-type(${scoreboardNthDict.t}), #match-scoreboard > tbody:nth-of-type(${scoreboardNthDict.ct})`)
  }

  function getPlayerRows (scoreboard) {
    return scoreboard.querySelectorAll('tr:nth-of-type(n+2)')
  }

  function sortScoreboard (scoreboard, colId, ascending = false) {
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent
    const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
      v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx))

    Array.from(getPlayerRows(scoreboard))
      .sort(comparer(colId, ascending))
      .forEach(tr => scoreboard.appendChild(tr))
  }

  // TODO Only do this on old games, because they now calculate Rating 2.0 for newly added games based on the same formula
  // FIXME Utility header to wide, +1 to prepending colspan
  insertRating20ScoreboardHeader()

  getScoreboards().forEach(scoreboard => {
    getPlayerRows(scoreboard).forEach(row => {
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
    sortScoreboard(scoreboard, tdDict.rating20, false)
  })
})()
