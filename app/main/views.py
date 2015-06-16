import cgi, calendar, time, twitter
from datetime import datetime, timedelta
from flask import render_template, jsonify, request, current_app
from . import main



@main.route('/')
def home():
    query = cgi.escape(request.args.get('q', ''))
    return render_template('home.jinja', query = query)


@main.route('/tw')
def tweets():
    query = cgi.escape(request.args.get('q', ''))
    tweets = _get_tweets(query)
    return jsonify({'tweets': tweets})



def _get_tweets(query, hours_within=48):
    if query is None or query == '':
        return []

    tw = _twitter_api()

    now = calendar.timegm(time.gmtime())
    time_threshold = now - (60 * 60 * hours_within)

    tweet_data = []
    min_id, api_calls, tw_ct = 1e100, 0, 0

    while True:
        api_calls += 1

        params = {
            'term': query,
            'count': 100,
            'geocode': [38.92, -77.06, '15mi'],
            'result_type': 'recent',
            'max_id': min_id,
        }

        tweets = tw.GetSearch(**params)
        tweets = [t for t in tweets if t.geo is not None]

        if len(tweets) == 0 or api_calls >= 10:
            break

        tweets = sorted(tweets, key=lambda tweet: -tweet.created_at_in_seconds)

        for tweet in tweets:
            tw_time = tweet.created_at_in_seconds

            if tw_time >= time_threshold:
                tw_ct += 1

                if tweet.id < min_id:
                    min_id = tweet.id - 1

                entry = {
                    'id': tweet.id,
                    'epoch': tw_time,
                    'created_at': tweet.created_at,
                    'coordinates': tweet.geo.get('coordinates'),
                    'txt': tweet.text,
                    'user': tweet.user.screen_name,
                }
                tweet_data.append(entry)
            else:
                return tweet_data

        if tw_ct > 500:
            return tweet_data

    return tweet_data


def _twitter_api():
    return twitter.Api(
        consumer_key = current_app.config['TWITTER_CONSUMER_KEY'],
        consumer_secret = current_app.config['TWITTER_CONSUMER_SECRET'],
        access_token_key = current_app.config['TWITTER_ACCESS_TOKEN_KEY'],
        access_token_secret = current_app.config['TWITTER_ACCESS_TOKEN_SECRET'],
    )

