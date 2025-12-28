import os
import json
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
from werkzeug.utils import secure_filename

# static_url_path='' ekleyerek CSS ve JS dosyalarının kök dizinden çalışmasını sağladık
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max dosya boyutu
DATA_FILE = 'data.json'

# Klasör ve dosya kontrolü
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        # Varsayılan ayarlar ve boş sayfa listesi
        default_data = {
            "settings": {"cover_color": "#ff8fa3", "cover_title": "Bizim Hikayemiz", "cover_subtitle": "Sevgilime...", "back_cover_text": "SON"},
            "pages": []
        }
        json.dump(default_data, f)

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"settings": {"cover_color": "#ff8fa3"}, "pages": []}

    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, ValueError):
        # Dosya bozuksa varsayılanı döndür
        return {"settings": {"cover_color": "#ff8fa3"}, "pages": []}

    # Eski veri yapısı (liste) kontrolü
    if isinstance(data, list):
        data = {"settings": {"cover_color": "#ff8fa3", "cover_title": "Bizim Hikayemiz", "cover_subtitle": "Sevgilime...", "back_cover_text": "SON"}, "pages": data}
    
    # Eksik anahtarları tamamla (Hata önleyici)
    if "settings" not in data:
        data["settings"] = {"cover_color": "#ff8fa3", "cover_title": "Bizim Hikayemiz", "cover_subtitle": "Sevgilime...", "back_cover_text": "SON"}
    else:
        # Settings var ama içindeki bazı anahtarlar eksik olabilir
        defaults = {"cover_color": "#ff8fa3", "cover_title": "Bizim Hikayemiz", "cover_subtitle": "Sevgilime...", "back_cover_text": "SON"}
        for key, value in defaults.items():
            if key not in data["settings"]:
                data["settings"][key] = value

    if "pages" not in data:
        data["pages"] = []
        
    return data

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    data = load_data()
    return render_template('index.html', data=data)

# CSS ve JS dosyalarını garanti altına almak için özel rotalar
@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('.', 'script.js')

@app.route('/admin')
def admin():
    data = load_data()
    return render_template('admin.html', data=data)

@app.route('/update_settings', methods=['POST'])
def update_settings():
    data = load_data()
    data['settings']['cover_color'] = request.form.get('cover_color', '#ff8fa3')
    data['settings']['cover_title'] = request.form.get('cover_title', 'Bizim Hikayemiz')
    data['settings']['cover_subtitle'] = request.form.get('cover_subtitle', 'Sevgilime...')
    data['settings']['back_cover_text'] = request.form.get('back_cover_text', 'SON')
    
    # Müzik Dosyası Yükleme
    music_file = request.files.get('background_music')
    if music_file and music_file.filename:
        filename = secure_filename(music_file.filename)
        music_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        data['settings']['background_music'] = filename

    save_data(data)
    return redirect(url_for('admin'))

# Anlık dosya yükleme (Admin panelinde önizleme için)
@app.route('/upload_media', methods=['POST'])
def upload_media():
    file = request.files.get('file')
    if file and file.filename:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'filename': filename})
    return jsonify({'error': 'Dosya yüklenemedi'}), 400

# Sayfayı JSON olarak kaydetme (Yeni yapı)
@app.route('/save_page', methods=['POST'])
def save_page():
    data = load_data()
    page_data = request.json
    page_index = page_data.get('page_index') # Düzenleme modu için index
    
    new_page = {
        'id': page_data.get('id', len(data['pages']) + 1),
        'front_content': page_data.get('front_content', []),
        'back_content': page_data.get('back_content', []),
        'paper_color': page_data.get('paper_color', '#fffbf0'),
        'page_style': page_data.get('page_style', ''),
        'page_date': page_data.get('page_date', '')
    }
    
    if page_index is not None:
        try:
            page_index = int(page_index)
        except ValueError:
            page_index = None

    if page_index is not None and 0 <= page_index < len(data['pages']):
        # Var olan sayfayı güncelle
        data['pages'][page_index] = new_page
    else:
        # Yeni sayfa ekle
        data['pages'].append(new_page)
        
    save_data(data)
    return jsonify({'success': True})

@app.route('/delete_page/<int:page_index>', methods=['POST'])
def delete_page(page_index):
    data = load_data()
    if 0 <= page_index < len(data['pages']):
        data['pages'].pop(page_index)
        save_data(data)
    return redirect(url_for('admin'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    print("Sunucu çalışıyor! http://localhost:5000 adresine git.")
    print("Admin paneli için: http://localhost:5000/admin")
    app.run(debug=True, port=5000)
