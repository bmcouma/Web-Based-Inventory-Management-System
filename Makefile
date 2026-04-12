.PHONY: install migrate seed run test

install:
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cp -n backend/.env.example backend/.env || true

migrate:
	cd backend && python manage.py migrate

seed:
	cd backend && python manage.py seed_data

run:
	cd backend && python manage.py runserver

test:
	cd backend && pytest tests/ -v

frontend-install:
	cd frontend && npm install

frontend-run:
	cd frontend && npm start

setup: install migrate seed
	@echo "\nSetup complete. Run 'make run' to start the server."
