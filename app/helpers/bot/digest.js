'use strict'

const { user, wif } = require('../../config')
const Promise = require('bluebird')
const steem = Promise.promisifyAll(require('steem'))
const moment = require('moment')
const Handlebars = require('handlebars')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

module.exports = {
    execute
}

function loadTemplate(template) {
    return fs.readFileAsync(template, 'utf8')
}

function execute() {
    var posts = steem.api.getDiscussionsByBlogAsync({tag: user, limit: 100})
        .then((result) => {
            // Filter posts by recent activity (one week)
            var posts = result.filter((post) => moment(post.created).diff(moment(), 'days') <= 7)
                .map((post) => {
                    return {
                        author: user,
                        permlink: post.permlink,
                        parent_permlink: post.parent_permlink,
                        created: post.created,
                        title: post.title
                    }
                })
            return posts
        }).
        then((posts) => {
            var context = {
                date: new Date().toISOString(),
                posts: posts
            }
            console.log(path.join(__dirname, '..', 'templates', 'post.hb'))
            return loadTemplate(path.join(__dirname, '..', 'templates', 'post.hb'))
                .then((template) => {
                    var templateSpec = Handlebars.compile(template)
                    return templateSpec(context)
                })
        }).then((digest) => {
            var permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
            steem.broadcast.commentAsync(
                wif,
                '', // Leave parent author empty
                'blog', // Main tag
                user, // Author
                permlink + '-post', // Permlink
                "This is my digest " + new Date().toISOString(), // Title
                digest, // Body
                { tags: ['digest'], app: 'r351574nc3/steem-digest-example' }
            ).then((results) => {
                console.log(results)
            })
        })

}