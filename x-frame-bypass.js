customElements.define('x-frame-bypass', class extends HTMLIFrameElement {
2		constructor () {
3			super()
4		}
5		connectedCallback () {
6			this.load(this.src)
7			this.src = ''
8			this.sandbox = '' + this.sandbox || 'allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation' // all except allow-top-navigation
9		}
10		load (url, options) {
11			if (!url || !url.startsWith('http'))
12				throw new Error(`X-Frame-Bypass src ${url} does not start with http(s)://`)
13			console.log('X-Frame-Bypass loading:', url)
14			this.srcdoc = `<html>
15	<head>
16		<style>
17		.loader {
18			position: absolute;
19			top: calc(50% - 25px);
20			left: calc(50% - 25px);
21			width: 50px;
22			height: 50px;
23			background-color: #333;
24			border-radius: 50%;  
25			animation: loader 1s infinite ease-in-out;
26		}
27		@keyframes loader {
28			0% {
29			transform: scale(0);
30			}
31			100% {
32			transform: scale(1);
33			opacity: 0;
34			}
35		}
36		</style>
37	</head>
38	<body>
39		<div class="loader"></div>
40	</body>
41	</html>`
42			this.fetchProxy(url, options, 0).then(res => res.text()).then(data => {
43				if (data)
44					this.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1>
45		<base href="${url}">
46		<script>
47		// X-Frame-Bypass navigation event handlers
48		document.addEventListener('click', e => {
49			if (frameElement && document.activeElement && document.activeElement.href) {
50				e.preventDefault()
51				frameElement.load(document.activeElement.href)
52			}
53		})
54		document.addEventListener('submit', e => {
55			if (frameElement && document.activeElement && document.activeElement.form && document.activeElement.form.action) {
56				e.preventDefault()
57				if (document.activeElement.form.method === 'post')
58					frameElement.load(document.activeElement.form.action, {method: 'post', body: new FormData(document.activeElement.form)})
59				else
60					frameElement.load(document.activeElement.form.action + '?' + new URLSearchParams(new FormData(document.activeElement.form)))
61			}
62		})
63		</script>`)
64			}).catch(e => console.error('Cannot load X-Frame-Bypass:', e))
65		}
66		fetchProxy (url, options, i) {
67			const proxy = [
68				'https://cors.io/?',
69				'https://jsonp.afeld.me/?url=',
70				'https://cors-anywhere.herokuapp.com/'
71			]
72			return fetch(proxy[i] + url, options).then(res => {
73				if (!res.ok)
74					throw new Error(`${res.status} ${res.statusText}`);
75				return res
76			}).catch(error => {
77				if (i === proxy.length - 1)
78					throw error
79				return this.fetchProxy(url, options, i + 1)
80			})
81		}
82	}, {extends: 'iframe'})
