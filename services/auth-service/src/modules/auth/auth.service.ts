import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioRepository } from '../usuarios/usuario.repository.js';
import { ValidationException, ConflictException, NotFoundException } from '../../shared/errors/BusinessException.js';
import type { RegisterDto, LoginDto, UpdateProfileDto } from './auth.dto.js';

export class AuthService {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  private generateToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any,
    });
  }

  private sanitize(user: any) {
    return {
      id:        user.id,
      email:     user.email,
      nombres:   user.nombres,
      apellidos: user.apellidos,
      role:      user.role ?? 'CLIENTE',
      telefono:  user.telefono ?? null,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usuarioRepository.findByEmailForLogin(dto.email);
    if (!user || !user.isActive) throw new ValidationException('Credenciales inválidas');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new ValidationException('Credenciales inválidas');

    const role = user.role ?? 'CLIENTE';
    const token = this.generateToken({ id: user.id, email: user.email, role });
    return { user: this.sanitize({ ...user, role }), token };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usuarioRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('El email ya está registrado');

    if (dto.cedula) {
      const byCedula = await this.usuarioRepository.findByCedula(dto.cedula);
      if (byCedula) throw new ConflictException('La cédula ya está registrada');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usuarioRepository.create({
      email: dto.email, passwordHash,
      nombres: dto.nombres, apellidos: dto.apellidos,
      cedula: dto.cedula ?? null, telefono: dto.telefono ?? null,
      ciudadId: dto.ciudadId ?? null, role: 'CLIENTE',
    });

    const token = this.generateToken({ id: user.id, email: user.email, role: user.role ?? 'CLIENTE' });
    return { user: this.sanitize(user), token };
  }

  async getProfile(userId: string) {
    const user = await this.usuarioRepository.findByIdWithRelations(userId);
    if (!user) throw new NotFoundException('Usuario', userId);
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usuarioRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario', userId);
    return this.usuarioRepository.update(userId, dto);
  }
}
